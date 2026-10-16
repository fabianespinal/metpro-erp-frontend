"use client";

import ErrorBanner from "@/components/ui/ErrorBanner";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  DEFAULT_INCLUDED_CHARGES,
  createDraftQuote,
  getTemplatePack,
  hasErrorCode,
  type IncludedCharges,
  type TemplatePack,
} from "@/lib/quotingApi";
import {
  canSave,
  linesFromPack,
  toQuoteItems,
  type TakeOffLine,
} from "@/lib/takeOffLines";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineCard, takeOffInputClass } from "@/components/quotes/takeoff/LineCard";
import { AddItemBar, type CatalogProduct } from "@/components/quotes/takeoff/AddItemBar";
import { TotalsPanel, type ChargeKey } from "@/components/quotes/takeoff/TotalsPanel";
import { useTotalsPreview } from "@/components/quotes/takeoff/useTotalsPreview";

/**
 * Quoting v1, module 6c. Take-off: items from the template pack, the catalog,
 * or entered by hand. Totals come from the backend preview (no browser math).
 * Save creates a Draft and opens the draft editor (module 7).
 */

export default function TakeOffPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">Loading…</div>}>
      <TakeOffScreen />
    </Suspense>
  );
}

function TakeOffScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const clientId = params.get("client_id") ?? "";
  const contactId = params.get("contact_id") ?? "";
  const packId = params.get("pack_id") ?? "";
  const paramsOk = Boolean(clientId && contactId && packId);

  const [pack, setPack] = useState<TemplatePack | null>(null);
  const [packError, setPackError] = useState<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [lines, setLines] = useState<TakeOffLine[]>([]);
  const [charges, setCharges] = useState<IncludedCharges>(DEFAULT_INCLUDED_CHARGES);
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");

  const { totals, totalsError } = useTotalsPreview(lines, charges);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Non-blocking load problems (catalog, contact). Shown above the totals.
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Load the template pack and seed lines from it.
  useEffect(() => {
    if (!packId) return;
    let cancelled = false;
    getTemplatePack(Number(packId))
      .then((p) => {
        if (cancelled) return;
        setPack(p);
        setLines(linesFromPack(p));
      })
      .catch((err: Error) => {
        if (!cancelled) setPackError(err.message || "Could not load the template pack.");
      });
    return () => {
      cancelled = true;
    };
  }, [packId]);

  // Load the product catalog for "add product".
  useEffect(() => {
    let cancelled = false;
    api("/products/")
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data) ? (data as CatalogProduct[]) : []);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setProducts([]);
        setCatalogError(`Could not load the product catalog: ${err.message}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const includedCount = lines.filter((l) => l.include).length;
  const saveAllowed = canSave(lines) && paramsOk && !saving;

  function updateLine(key: string, patch: Partial<TakeOffLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function addLine(line: TakeOffLine) {
    setLines((prev) => [...prev, line]);
  }

  function setChargePercentage(key: ChargeKey, value: number) {
    setCharges((prev) => ({ ...prev, [`${key}_percentage`]: value }));
  }

  function toggleCharge(key: keyof IncludedCharges) {
    setCharges((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    if (!saveAllowed) return;
    setSaving(true);
    setSaveError(null);
    try {
      const quote = await createDraftQuote({
        client_id: Number(clientId),
        contact_id: Number(contactId),
        project_name: projectName.trim() || null,
        notes: notes.trim() || null,
        payment_terms: paymentTerms.trim() || null,
        valid_until: null,
        items: toQuoteItems(lines),
        included_charges: charges,
      });
      router.push(`/quotes/${quote.quote_id}/edit`);
    } catch (err) {
      if (hasErrorCode(err, "PRODUCT_NOT_FOUND")) {
        setSaveError("A product in this quote no longer exists. Remove it and try again.");
      } else {
        setSaveError((err as Error).message || "Could not save the draft.");
      }
      setSaving(false);
    }
  }

  if (!paramsOk) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <Alert variant="destructive">
          <AlertDescription>
            Missing client, contact or template. Start again from the new quote page.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/quotes/new" className="text-accent underline">
            Back to new quote
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Take-off"
        subtitle={pack ? `Template: ${pack.name}` : "Select the items for this quote"}
        actions={
          <Button asChild variant="outline">
            <Link href="/quotes/new">Change template</Link>
          </Button>
        }
      />

      {packError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{packError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <AddItemBar products={products} onAdd={addLine} />

          {lines.length === 0 ? (
            <p className="text-sm text-muted">No items yet. Add items from the template or the catalog.</p>
          ) : (
            <ul className="space-y-3">
              {lines.map((line) => (
                <LineCard
                  key={line.key}
                  line={line}
                  onChange={(patch) => updateLine(line.key, patch)}
                  onRemove={line.source === "pack" ? undefined : () => removeLine(line.key)}
                />
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <ErrorBanner message={catalogError} />
          <TotalsPanel
            charges={charges}
            onToggleCharge={toggleCharge}
            onChangePercentage={setChargePercentage}
            totals={totals}
            totalsError={totalsError}
            includedCount={includedCount}
          />

          <section className="rounded-lg border border-line bg-surface p-4 shadow-card space-y-3">
            <h2 className="text-sm font-semibold text-ink">Quote details</h2>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className={takeOffInputClass}
              aria-label="Project name"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              rows={3}
              className={takeOffInputClass}
              aria-label="Notes"
            />
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Payment terms"
              className={takeOffInputClass}
              aria-label="Payment terms"
            />
          </section>

          {saveError ? (
            <Alert variant="destructive">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          ) : null}

          <Button onClick={handleSave} disabled={!saveAllowed} className="w-full">
            {saving ? "Saving draft…" : "Save draft"}
          </Button>
          {includedCount === 0 ? (
            <p className="text-xs text-muted">Include at least one item to save.</p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
