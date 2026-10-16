"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  listTemplatePacks,
  type TemplatePackSummary,
} from "@/lib/quotingApi";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Quoting v1, module 6b. Step 1: client and contact. Step 2: template pack.
 * Continue goes to the take-off screen (module 6c) with IDs in the query string.
 * IDs only. No names or contact details in the URL.
 */

interface Client {
  id: number;
  company_name: string;
}

interface Contact {
  id: number;
  name: string;
  email?: string | null;
}

const selectClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";

export default function NewQuotePage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState<string>("");

  const [packs, setPacks] = useState<TemplatePackSummary[]>([]);
  const [packId, setPackId] = useState<number | null>(null);

  const [loadingPacks, setLoadingPacks] = useState(true);
  const [packError, setPackError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    api("/clients")
      .then((data) => setClients(Array.isArray(data) ? (data as Client[]) : []))
      .catch(() => setClientError("Could not load clients. Refresh to try again."));

    listTemplatePacks()
      .then((data) => setPacks(Array.isArray(data) ? data : []))
      .catch((err: Error) => setPackError(err.message || "Could not load template packs."))
      .finally(() => setLoadingPacks(false));
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    api(`/contacts/company/${clientId}`)
      .then((data) => {
        if (!cancelled) setContacts(Array.isArray(data) ? (data as Contact[]) : []);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setContacts([]);
        setClientError(`Could not load contacts for this client: ${err.message}`);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  function handleClientChange(value: string) {
    setClientId(value);
    setContactId("");
    setContacts([]);
  }

  const selectedPack = useMemo(
    () => packs.find((p) => p.id === packId) ?? null,
    [packs, packId]
  );

  const canContinue = Boolean(clientId && contactId && packId);

  function handleContinue() {
    if (!canContinue) return;
    const params = new URLSearchParams({
      client_id: clientId,
      contact_id: contactId,
      pack_id: String(packId),
    });
    router.push(`/quotes/new/take-off?${params.toString()}`);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader
        title="New quote"
        subtitle="Choose the client, the contact and a template pack. Next, select the items."
        actions={
          <Button asChild variant="outline">
            <Link href="/quotes">Back to quotes</Link>
          </Button>
        }
      />

      {/* STEP 1: CLIENT AND CONTACT */}
      <section aria-labelledby="step-client" className="mb-8">
        <h2 id="step-client" className="mb-3 text-base font-semibold text-ink">
          1. Client and contact
        </h2>

        {clientError ? (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{clientError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Client</span>
            <select
              className={selectClass}
              value={clientId}
              onChange={(e) => handleClientChange(e.target.value)}
            >
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Contact</span>
            <select
              className={selectClass}
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              disabled={!clientId}
            >
              <option value="">
                {!clientId
                  ? "Select a client first"
                  : contacts.length === 0
                  ? "No contacts for this client"
                  : "Select a contact"}
              </option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.email ? ` — ${c.email}` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        {clientId && contacts.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Add a contact for this client on the{" "}
            <Link href={`/contacts/${clientId}`} className="text-accent underline">
              contacts page
            </Link>{" "}
            first.
          </p>
        ) : null}
      </section>

      {/* STEP 2: TEMPLATE PACK */}
      <section aria-labelledby="step-pack" className="mb-8">
        <h2 id="step-pack" className="mb-3 text-base font-semibold text-ink">
          2. Template pack
        </h2>

        {packError ? (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{packError}</AlertDescription>
          </Alert>
        ) : null}

        {loadingPacks ? (
          <p className="text-sm text-muted">Loading template packs…</p>
        ) : !packError && packs.length === 0 ? (
          <p className="text-sm text-muted">
            No template packs yet. An admin can create them from the template packs page.
          </p>
        ) : (
          <div role="radiogroup" aria-label="Template pack" className="grid gap-3 sm:grid-cols-2">
            {packs.map((pack) => {
              const selected = pack.id === packId;
              return (
                <button
                  key={pack.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPackId(pack.id)}
                  className={[
                    "rounded-lg border bg-surface p-4 text-left shadow-card transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    selected ? "border-accent ring-1 ring-accent" : "border-line hover:bg-canvas",
                  ].join(" ")}
                >
                  <span className="block text-sm font-semibold text-ink">{pack.name}</span>
                  {pack.description ? (
                    <span className="mt-1 block text-sm text-muted">{pack.description}</span>
                  ) : null}
                  <span className="mt-2 block text-xs text-muted">
                    {pack.category_count} categories · {pack.item_count} items
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* FOOTER */}
      <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {selectedPack ? `Template: ${selectedPack.name}` : "No template selected"}
        </p>
        <Button onClick={handleContinue} disabled={!canContinue} className="w-full sm:w-auto">
          Continue to items
        </Button>
      </div>
    </div>
  );
}
