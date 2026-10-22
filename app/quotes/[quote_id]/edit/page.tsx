"use client";

import { es } from "@/lib/i18n/es";
import { getStatusLabel } from "@/lib/i18n/statusLabel";
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
import QuoteCostEstimate from "@/components/quotes/QuoteCostEstimate";
import { calculateQuoteTotals } from "@/components/quotes/quoteUtils";
import { useCurrentRole } from "@/lib/currentRole";
import { isEstimateQuote, moneyChanged, moneyLocked, needsEditReason } from "@/lib/estimatorCalc";
import { useTotalsPreview } from "@/components/quotes/takeoff/useTotalsPreview";
import { LockedLines } from "@/components/quotes/estimate/LockedLines";
import { PrintItemsToggle } from "@/components/quotes/PrintItemsToggle";
import { usePdfOptions } from "@/lib/pdfOptions";
import { TotalRow } from "@/components/quotes/takeoff/LineCard";
import TaxTypeSelect from "@/components/quotes/TaxTypeSelect";
import { useTaxTypes } from "@/components/quotes/useTaxTypes";

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
  QUOTE_EMPTY: es.cot.codigos.QUOTE_EMPTY,
  QUOTE_NOT_DRAFT: es.cot.codigos.QUOTE_NOT_DRAFT,
  QUOTE_FINALIZED: es.cot.codigos.QUOTE_FINALIZED,
  PRODUCT_NOT_FOUND: es.cot.codigos.PRODUCT_NOT_FOUND,
  ESTIMATE_LOCKED: es.est.errBloqueado,
  ESTIMATE_EDIT_REASON_REQUIRED: es.est.errMotivo,
};

function messageFor(err: unknown, fallback: string): string {
  for (const code of Object.keys(ERROR_MESSAGES)) {
    if (hasErrorCode(err, code)) return ERROR_MESSAGES[code];
  }
  return (err as Error)?.message || fallback;
}

export default function DraftEditorPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted">{es.cot.cargandoCotizacion}</div>}>
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
  const { isAdmin } = useCurrentRole();
  const [editReason, setEditReason] = useState("");

  const [quote, setQuote] = useState<QuoteOut | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contactName, setContactName] = useState<string | null>(null);

  const [rawLines, setLines] = useState<TakeOffLine[]>([]);
  const [charges, setCharges] = useState<IncludedCharges | null>(null);
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [printItems, setPrintItems] = useState(true);
  // Tax type of this quote (A1). Changeable while Draft; the backend stores the snapshot on save.
  const { taxTypes } = useTaxTypes();
  const [taxTypeCode, setTaxTypeCode] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const { medidas_enabled } = usePdfOptions();
  // Draft lines with a product and no unit set (null) show the product's current unit. It is saved with the
  // next save, so the draft's PDF picks it up. A unit cleared on purpose is "" and stays blank.
  const lines = useMemo(
    () =>
      medidas_enabled
        ? rawLines.map((l) =>
            l.unit_of_measure === null && l.product_id != null
              ? { ...l, unit_of_measure: products.find((p) => p.id === l.product_id)?.unit_of_measure ?? null }
              : l
          )
        : rawLines,
    [rawLines, products, medidas_enabled]
  );

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
  // The rate comes from the chosen type; for a type not in the active list (e.g. a quote made earlier with a
  // type that was later switched off) it falls back to the quote's own stored snapshot.
  const chosen = taxTypes.find((t) => t.code === taxTypeCode) ?? null;
  const taxRate = chosen ? chosen.rate : quote?.tax_rate != null ? Number(quote.tax_rate) : undefined;
  const taxLabel = chosen ? chosen.label : quote?.tax_label ?? undefined;
  const calculatedTotals = useMemo(
    () => (charges ? calculateQuoteTotals(toQuoteItems(lines), charges, charges.dynamic_charges ?? [], taxRate) : null),
    [lines, charges, taxRate],
  );

  const isEst = isEstimateQuote(quote);
  const locked = moneyLocked(quote, isAdmin);
  // Estimate quotes: totals come from the backend with the quote's own tax (1.8%), never the 18% client math.
  const { totals: backendTotals } = useTotalsPreview(
    lines,
    charges ?? DEFAULT_INCLUDED_CHARGES,
    quote?.tax_type_code ?? undefined,
    isEst && charges !== null
  );

  function applyQuote(q: QuoteOut) {
    const loadedLines = linesFromQuote(q.items ?? []).map((l) =>
      q.status === "Draft" && l.product_id != null && !l.unit_of_measure ? { ...l, unit_of_measure: null } : l
    );
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
    setPrintItems(q.print_items !== false);
    setTaxTypeCode(q.tax_type_code ?? "");
    setSavedSnapshot(
      snapshotOf({
        project_name: q.project_name ?? "",
        notes: q.notes ?? "",
        payment_terms: q.payment_terms ?? "",
        print_items: q.print_items !== false,
        tax_type_code: q.tax_type_code ?? "",
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
        if (!cancelled) setLoadError(err.message || es.cot.errorCargarCotizacion);
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
        setCatalogError(es.cot.errorCatalogo(err.message));
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
        setCatalogError(es.cot.errorContacto(err.message));
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
      print_items: printItems,
      tax_type_code: taxTypeCode,
      lines,
      charges: charges ?? DEFAULT_INCLUDED_CHARGES,
    }),
    [projectName, notes, paymentTerms, printItems, taxTypeCode, lines, charges]
  );
  const dirty = savedSnapshot !== "" && snapshotOf(payload) !== savedSnapshot;
  const includedCount = lines.filter((l) => l.include).length;
  const isDraft = quote?.status === "Draft";
  const moneyDirty = isEst && savedSnapshot !== "" && moneyChanged(savedSnapshot, snapshotOf(payload));
  const reasonNeeded = needsEditReason(quote, isAdmin) && moneyDirty;
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
      setActionError(es.cot.lineaInvalida);
      return false;
    }
    if (reasonNeeded && !editReason.trim()) {
      setActionError(es.est.errMotivo);
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
        print_items: printItems,
        ...(reasonNeeded ? { edit_reason: editReason.trim() } : {}),
        // Sent only when the stored type differs from the one chosen here.
        ...(taxTypeCode && taxTypeCode !== quote?.tax_type_code ? { tax_type_code: taxTypeCode } : {}),
      });
      applyQuote(updated);
      setEditReason("");
      setSaveMessage(es.cot.borradorGuardado);
      return true;
    } catch (err) {
      setActionError(messageFor(err, es.cot.errorBorrador));
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
      setActionError(messageFor(err, es.cot.errorFinalizar));
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
            {es.cot.volverCotizaciones}
          </Link>
        </div>
      </div>
    );
  }

  if (!quote || charges === null) {
    return <div className="p-6 text-sm text-muted">{es.cot.cargandoCotizacion}</div>;
  }

  if (!isDraft) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        <PageHeader title={es.cot.tituloCotizacion} subtitle={es.cot.estadoLabel(getStatusLabel(String(quote.status), "f"))} />
        <Alert className="mb-4">
          <AlertDescription>
            {es.cot.soloBorradorEditable(getStatusLabel(String(quote.status), "f"))}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href={`/quotes/${quoteId}/view`}>{es.cot.verCotizacion}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <PageHeader
        title={es.cot.tituloBorrador}
        subtitle={`${projectName || es.cot.sinNombreProyecto} · ${es.cot.contactoLabel}: ${contactName ?? "—"}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/quotes">{es.cot.volverCotizaciones}</Link>
          </Button>
        }
      />

      {fromDuplicate && bannerOpen ? (
        <Alert className="mb-4 flex items-start justify-between gap-3">
          <AlertDescription>{es.cot.cotizacionDuplicada}</AlertDescription>
          <button
            type="button"
            onClick={() => setBannerOpen(false)}
            className="shrink-0 text-sm text-muted underline hover:text-ink"
          >
            {es.cot.descartar}
          </button>
        </Alert>
      ) : null}

      {isEst ? (
        <Alert className="mb-4" data-testid="estimate-banner">
          <AlertDescription>{locked ? es.est.bannerEstimado : es.est.bannerAdmin}</AlertDescription>
        </Alert>
      ) : null}

      {actionError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {locked ? null : <AddItemBar products={products} onAdd={addLine} />}

          {lines.length === 0 ? (
            <p className="text-sm text-muted">{es.cot.sinArticulos}</p>
          ) : locked ? (
            <LockedLines lines={lines} />
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
              {locked ? null : <SurchargeControls charges={charges} setCharges={handleChargesChange} />}
              {isEst ? null : (
                <TaxTypeSelect
                  taxTypes={taxTypes}
                  value={taxTypeCode}
                  disabled={!canWrite}
                  onChange={(c) => {
                    setTaxTypeCode(c);
                    setSaveMessage(null);
                  }}
                />
              )}
              {isEst ? (
                <section className="rounded-lg border border-line bg-surface p-4 shadow-card" data-testid="estimate-totals">
                  <h2 className="mb-3 text-sm font-semibold text-ink">{es.cot.totales}</h2>
                  <dl className="space-y-1.5 text-sm">
                    <TotalRow label={es.cot.panelArticulos} value={backendTotals?.items_total} />
                    <TotalRow label={es.cot.menosDescuentos} value={backendTotals?.total_discounts} />
                    <TotalRow label={es.cot.panelSubtotal} value={backendTotals?.subtotal} />
                    <TotalRow label={quote.tax_label ?? es.est.impuesto} value={backendTotals?.tax_amount} />
                    <div className="my-2 border-t border-line" />
                    <TotalRow label={es.cot.panelTotal} value={backendTotals?.grand_total} strong />
                  </dl>
                </section>
              ) : (
                <QuoteTotalsDisplay totals={calculatedTotals} charges={charges} taxLabel={taxLabel} />
              )}
              {isEst ? null : <QuoteCostEstimate items={toQuoteItems(lines)} charges={charges} />}
            </>
          )}

          <section className="rounded-lg border border-line bg-surface p-4 shadow-card space-y-3">
            <h2 className="text-sm font-semibold text-ink">{es.cot.detalles}</h2>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder={es.cot.nombreProyecto}
              className={takeOffInputClass}
              aria-label={es.cot.nombreProyecto}
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={es.cot.notas}
              rows={3}
              className={takeOffInputClass}
              aria-label={es.cot.notas}
            />
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder={es.cot.terminosPago}
              className={takeOffInputClass}
              aria-label={es.cot.terminosPago}
            />
            <PrintItemsToggle
              checked={printItems}
              onChange={(v) => {
                setPrintItems(v);
                setSaveMessage(null);
              }}
              disabled={!canWrite}
            />
          </section>

          {reasonNeeded ? (
            <input
              type="text"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder={es.est.motivoCambio}
              className={takeOffInputClass}
              aria-label={es.est.motivoCambio}
            />
          ) : null}

          {saveMessage ? <p className="text-sm text-muted">{saveMessage}</p> : null}
          {dirty ? <p className="text-sm text-muted">{es.cot.cambiosSinGuardar}</p> : null}

          <Button onClick={handleSave} disabled={!canWrite || !dirty} variant="outline" className="w-full">
            {saving ? es.cot.guardando : es.cot.guardarBorrador}
          </Button>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!canWrite || includedCount === 0}
            className="w-full"
          >
            {es.cot.finalizar}
          </Button>
          {includedCount === 0 ? (
            <p className="text-xs text-muted">{es.cot.incluyaUno}</p>
          ) : null}
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => !finalizing && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{es.cot.finalizarPregunta}</DialogTitle>
            <DialogDescription>
              {es.cot.finalizarAviso}
              {dirty ? es.cot.cambiosSeGuardan : ""}
            </DialogDescription>
          </DialogHeader>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{es.cot.articulosIncluidos}</dt>
              <dd className="text-ink">{includedCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{es.cot.subtotalGeneral}</dt>
              <dd className="text-ink">{isEst ? (backendTotals ? formatMoney(backendTotals.subtotal) : "—") : calculatedTotals ? formatMoney(parseFloat(calculatedTotals.subtotal_general)) : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{isEst ? (quote.tax_label ?? es.est.impuesto) : (taxLabel ?? es.cot.itbis)}</dt>
              <dd className="text-ink">{isEst ? (backendTotals ? formatMoney(backendTotals.tax_amount) : "—") : calculatedTotals ? formatMoney(parseFloat(calculatedTotals.itbis)) : "—"}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt className="text-ink">{es.cot.totalGeneral}</dt>
              <dd className="text-ink">{isEst ? (backendTotals ? formatMoney(backendTotals.grand_total) : "—") : calculatedTotals ? formatMoney(parseFloat(calculatedTotals.grand_total)) : "—"}</dd>
            </div>
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={finalizing}>
              {es.cot.cancelar}
            </Button>
            <Button onClick={handleConfirmFinalize} disabled={finalizing}>
              {finalizing ? es.cot.finalizando : es.cot.finalizarCorto}
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
  print_items: boolean;
  tax_type_code: string;
  lines: TakeOffLine[];
  charges: IncludedCharges;
}): string {
  return JSON.stringify({
    project_name: p.project_name.trim(),
    notes: p.notes.trim(),
    payment_terms: p.payment_terms.trim(),
    print_items: p.print_items,
    tax_type_code: p.tax_type_code,
    items: toQuoteItems(p.lines),
    included_charges: p.charges,
  });
}
