"use client";

import ErrorBanner from "@/components/ui/ErrorBanner";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  finalizeQuote,
  getQuote,
  DEFAULT_INCLUDED_CHARGES,
  hasErrorCode,
  updateDraftQuote,
  type IncludedCharges,
  type QuoteOut,
} from "@/lib/quotingApi";
import {
  canSave,
  formatMoney,
  linesFromQuote,
  parseIncludedCharges,
  toQuoteItems,
  type TakeOffLine,
} from "@/lib/takeOffLines";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LineCard, takeOffInputClass } from "@/components/quotes/takeoff/LineCard";
import { AddItemBar, type CatalogProduct } from "@/components/quotes/takeoff/AddItemBar";
import SurchargeControls from "@/components/quotes/SurchargeControls";
import QuoteTotalsDisplay from "@/components/quotes/QuoteTotalsDisplay";
import { calculateQuoteTotals } from "@/components/quotes/quoteUtils";

/**
 * Quoting v1, module 7. Draft editor. Edits Draft quotes only.
 * Save writes the draft (PUT). Finalize saves any unsaved edits first, then
 * calls POST /quotes/{id}/finalize after the user confirms.
 */

interface Contact {
  id: number;
  name: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  QUOTE_EMPTY: "Add at least one item before finalizing.",
  QUOTE_NOT_DRAFT: "This quote is no longer a draft. Reload to see its current status.",
  QUOTE_FINALIZED: "This quote is finalized and cannot be edited.",
  PRODUCT_NOT_FOUND: "A product in this quote no longer exists. Remove it and try again.",
};

function messageFor(err: unknown, fallback: string): string {
  for (const code of Object.keys(ERROR_MESSAGES)) {
    if (hasErrorCode(err, code)) return ERROR_MESSAGES[code];
  }
  return (err as Error)?.message || fallback;
}

export default function DraftEditorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">Loading quote…</div>}>
      <DraftEditor />
    </Suspense>
  );
}

function DraftEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromDuplicate = searchParams.get("duplicated") === "1";
  const [bannerOpen, setBannerOpen] = useState(true);
  const params = useParams<{ quote_id: string }>();
  const quoteId = params.quote_id;

  const [quote, setQuote] = useState<QuoteOut | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contactName, setContactName] = useState<string | null>(null);

  const [lines, setLines] = useState<TakeOffLine[]>([]);
  const [charges, setCharges] = useState<IncludedCharges | null>(null);
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  // Snapshot of the last saved payload. Dirty = current differs.
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Non-blocking load problems (catalog, contact). Shown above the totals.
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  // Derived, not stored: recomputed when lines or charges change.
  const calculatedTotals = useMemo(
    () => (charges ? calculateQuoteTotals(toQuoteItems(lines), charges, charges.dynamic_charges ?? []) : null),
    [lines, charges],
  );

  function applyQuote(q: QuoteOut) {
    const loadedLines = linesFromQuote(q.items ?? []);
    const loadedCharges = parseIncludedCharges(q.included_charges);
    // Legacy quotes have no dynamic_charges: default to none.
    const chargesWithDynamic: IncludedCharges = {
      ...loadedCharges,
      dynamic_charges: loadedCharges.dynamic_charges ?? [],
    };
    setQuote(q);
    setLines(loadedLines);
    setCharges(chargesWithDynamic);
    setProjectName(q.project_name ?? "");
    setNotes(q.notes ?? "");
    setPaymentTerms(q.payment_terms ?? "");
    setSavedSnapshot(
      snapshotOf({
        project_name: q.project_name ?? "",
        notes: q.notes ?? "",
        payment_terms: q.payment_terms ?? "",
        lines: loadedLines,
        charges: loadedCharges,
      })
    );
  }

  useEffect(() => {
    let cancelled = false;
    getQuote(quoteId)
      .then((q) => {
        if (!cancelled) applyQuote(q);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message || "Could not load the quote.");
      });
    return () => {
      cancelled = true;
    };
  }, [quoteId]);

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

  // Contact name for display. The quote stores contact_id only.
  useEffect(() => {
    if (!quote?.client_id || !quote?.contact_id) return;
    let cancelled = false;
    api(`/contacts/company/${quote.client_id}`)
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const match = (data as Contact[]).find((c) => c.id === quote.contact_id);
        setContactName(match ? match.name : null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setContactName(null);
        setCatalogError(`Could not load the contact: ${err.message}`);
      });
    return () => {
      cancelled = true;
    };
  }, [quote]);

  const payload = useMemo(
    () => ({
      project_name: projectName,
      notes,
      payment_terms: paymentTerms,
      lines,
      charges: charges ?? DEFAULT_INCLUDED_CHARGES,
    }),
    [projectName, notes, paymentTerms, lines, charges]
  );
  const dirty = savedSnapshot !== "" && snapshotOf(payload) !== savedSnapshot;
  const includedCount = lines.filter((l) => l.include).length;
  const isDraft = quote?.status === "Draft";
  const canWrite = isDraft && charges !== null && !saving && !finalizing;

  function updateLine(key: string, patch: Partial<TakeOffLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setSaveMessage(null);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
    setSaveMessage(null);
  }

  function addLine(line: TakeOffLine) {
    setLines((prev) => [...prev, line]);
    setSaveMessage(null);
  }

  function handleChargesChange(newCharges: IncludedCharges) {
    setCharges(newCharges);
    setSaveMessage(null);
  }

  /** Writes the current edits. Returns true on success. */
  async function persistDraft(): Promise<boolean> {
    if (!charges) return false;
    if (!canSave(lines)) {
      setActionError("Every included item needs a name and a quantity above zero.");
      return false;
    }
    setSaving(true);
    setActionError(null);
    try {
      const updated = await updateDraftQuote(quoteId, {
        project_name: projectName.trim() || null,
        notes: notes.trim() || null,
        payment_terms: paymentTerms.trim() || null,
        items: toQuoteItems(lines),
        included_charges: charges,
      });
      applyQuote(updated);
      setSaveMessage("Draft saved.");
      return true;
    } catch (err) {
      setActionError(messageFor(err, "Could not save the draft."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    await persistDraft();
  }

  async function handleConfirmFinalize() {
    setFinalizing(true);
    setActionError(null);
    try {
      if (dirty) {
        const ok = await persistDraft();
        if (!ok) {
          setFinalizing(false);
          return;
        }
      }
      await finalizeQuote(quoteId);
      // The view page calls a route that does not exist yet (pre-existing). Return to the list.
      router.push("/quotes");
    } catch (err) {
      setActionError(messageFor(err, "Could not finalize the quote."));
      setFinalizing(false);
      setConfirmOpen(false);
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/quotes" className="text-accent underline">
            Back to quotes
          </Link>
        </div>
      </div>
    );
  }

  if (!quote || charges === null) {
    return <div className="p-6 text-sm text-muted">Loading quote…</div>;
  }

  if (!isDraft) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <PageHeader title="Quote" subtitle={`Status: ${quote.status}`} />
        <Alert className="mb-4">
          <AlertDescription>
            Only draft quotes can be edited. This quote is {quote.status}.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={`/quotes/${quoteId}/view`}>View quote</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Draft quote"
        subtitle={`${projectName || "No project name"} · Contact: ${contactName ?? "—"}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/quotes">Back to quotes</Link>
          </Button>
        }
      />

      {fromDuplicate && bannerOpen ? (
        <Alert className="mb-4 flex items-start justify-between gap-3">
          <AlertDescription>This is a duplicated quote. Adjust as needed.</AlertDescription>
          <button
            type="button"
            onClick={() => setBannerOpen(false)}
            className="shrink-0 text-sm text-muted underline hover:text-ink"
          >
            Dismiss
          </button>
        </Alert>
      ) : null}

      {actionError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <AddItemBar products={products} onAdd={addLine} />

          {lines.length === 0 ? (
            <p className="text-sm text-muted">No items. Add at least one item before finalizing.</p>
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

          {charges && (
            <>
              <SurchargeControls charges={charges} setCharges={handleChargesChange} />
              <QuoteTotalsDisplay totals={calculatedTotals} charges={charges} />
            </>
          )}

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

          {saveMessage ? <p className="text-sm text-muted">{saveMessage}</p> : null}
          {dirty ? <p className="text-sm text-muted">Unsaved changes.</p> : null}

          <Button onClick={handleSave} disabled={!canWrite || !dirty} variant="outline" className="w-full">
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!canWrite || includedCount === 0}
            className="w-full"
          >
            Finalize quote
          </Button>
          {includedCount === 0 ? (
            <p className="text-xs text-muted">Include at least one item to finalize.</p>
          ) : null}
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => !finalizing && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize this quote?</DialogTitle>
            <DialogDescription>
              The quote becomes Final. Items and charges lock. A public link is created.
              {dirty ? " Unsaved changes are saved first." : ""}
            </DialogDescription>
          </DialogHeader>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Items included</dt>
              <dd className="text-ink">{includedCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal General</dt>
              <dd className="text-ink">{calculatedTotals ? formatMoney(parseFloat(calculatedTotals.subtotal_general)) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">ITBIS (18%)</dt>
              <dd className="text-ink">{calculatedTotals ? formatMoney(parseFloat(calculatedTotals.itbis)) : "—"}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt className="text-ink">Grand total</dt>
              <dd className="text-ink">{calculatedTotals ? formatMoney(parseFloat(calculatedTotals.grand_total)) : "—"}</dd>
            </div>
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={finalizing}>
              Cancel
            </Button>
            <Button onClick={handleConfirmFinalize} disabled={finalizing}>
              {finalizing ? "Finalizing…" : "Finalize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function snapshotOf(p: {
  project_name: string;
  notes: string;
  payment_terms: string;
  lines: TakeOffLine[];
  charges: IncludedCharges;
}): string {
  return JSON.stringify({
    project_name: p.project_name.trim(),
    notes: p.notes.trim(),
    payment_terms: p.payment_terms.trim(),
    items: toQuoteItems(p.lines),
    included_charges: p.charges,
  });
}
