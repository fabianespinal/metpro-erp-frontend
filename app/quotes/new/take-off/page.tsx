"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  DEFAULT_INCLUDED_CHARGES,
  createDraftQuote,
  getTemplatePack,
  hasErrorCode,
  previewQuoteTotals,
  type DiscountType,
  type IncludedCharges,
  type ItemType,
  type TemplatePack,
  type TotalsPreview,
} from "@/lib/quotingApi";
import {
  canSave,
  formatMoney,
  lineProblem,
  lineTotal,
  linesFromPack,
  newManualLine,
  newProductLine,
  toPreviewInput,
  toQuoteItems,
  type TakeOffLine,
} from "@/lib/takeOffLines";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Quoting v1, module 6c. Take-off: items from the template pack, the catalog,
 * or entered by hand. Totals come from the backend preview (no browser math).
 * Save creates a Draft. Finalize is module 7.
 */

interface Product {
  id: number;
  name: string;
  unit_price: number;
}

const CHARGE_LABELS: { key: keyof IncludedCharges; label: string }[] = [
  { key: "supervision", label: "Supervision" },
  { key: "admin", label: "Admin" },
  { key: "insurance", label: "Insurance" },
  { key: "transport", label: "Transport" },
  { key: "contingency", label: "Contingency" },
];

const inputClass =
  "w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<TakeOffLine[]>([]);
  const [charges, setCharges] = useState<IncludedCharges>(DEFAULT_INCLUDED_CHARGES);
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");

  const [totals, setTotals] = useState<TotalsPreview | null>(null);
  const [totalsError, setTotalsError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");

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
        if (!cancelled) setProducts(Array.isArray(data) ? (data as Product[]) : []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Totals preview. Debounced. Backend computes; this only displays.
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      previewQuoteTotals(toPreviewInput(lines, charges))
        .then((t) => {
          if (!cancelled) {
            setTotals(t);
            setTotalsError(null);
          }
        })
        .catch((err: Error) => {
          if (!cancelled) setTotalsError(err.message || "Could not update totals.");
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [lines, charges]);

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [products, productQuery]);

  const includedCount = lines.filter((l) => l.include).length;
  const saveAllowed = canSave(lines) && paramsOk && !saving;

  // ----- line handlers -----

  function updateLine(key: string, patch: Partial<TakeOffLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function addProduct(product: Product) {
    setLines((prev) => [...prev, newProductLine(product)]);
    setProductQuery("");
  }

  function addManual(itemType: ItemType) {
    setLines((prev) => [...prev, newManualLine(itemType)]);
  }

  function toggleCharge(key: keyof IncludedCharges) {
    setCharges((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ----- save -----

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
      router.push(`/quotes/${quote.quote_id}/view`);
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
        {/* LEFT: LINES */}
        <div className="min-w-0 space-y-6">
          {/* Add controls */}
          <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-ink">Add item</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
              <div className="relative">
                <input
                  type="text"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products"
                  className={inputClass}
                  aria-label="Search products"
                />
                {filteredProducts.length > 0 ? (
                  <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-card">
                    {filteredProducts.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => addProduct(p)}
                          className="flex w-full justify-between px-3 py-2 text-left text-sm text-ink hover:bg-canvas"
                        >
                          <span>{p.name}</span>
                          <span className="text-muted">{formatMoney(p.unit_price)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <Button variant="secondary" onClick={() => addManual("service")}>
                Add service
              </Button>
              <Button variant="secondary" onClick={() => addManual("custom")}>
                Add custom
              </Button>
            </div>
          </section>

          {/* Lines */}
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

        {/* RIGHT: SUMMARY */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-ink">Included charges</h2>
            <div className="grid grid-cols-2 gap-2">
              {CHARGE_LABELS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={Boolean(charges[key])}
                    onChange={() => toggleCharge(key)}
                    className="h-4 w-4"
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-ink">Totals</h2>
            {totalsError ? (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>{totalsError}</AlertDescription>
              </Alert>
            ) : null}
            <dl className="space-y-1.5 text-sm">
              <TotalRow label="Items" value={totals?.items_total} />
              <TotalRow label="Less discounts" value={totals?.total_discounts} />
              <TotalRow label="Subtotal" value={totals?.subtotal} />
              <TotalRow label="ITBIS (18%)" value={totals?.tax_amount} />
              <div className="my-2 border-t border-line" />
              <TotalRow label="Grand total" value={totals?.grand_total} strong />
            </dl>
            <p className="mt-2 text-xs text-muted">
              {includedCount} item{includedCount === 1 ? "" : "s"} included. Totals are calculated by the server.
            </p>
          </section>

          <section className="rounded-lg border border-line bg-surface p-4 shadow-card space-y-3">
            <h2 className="text-sm font-semibold text-ink">Quote details</h2>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className={inputClass}
              aria-label="Project name"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes"
              rows={3}
              className={inputClass}
              aria-label="Notes"
            />
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="Payment terms"
              className={inputClass}
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
          {!canSave(lines) && includedCount === 0 ? (
            <p className="text-xs text-muted">Include at least one item to save.</p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function TotalRow({ label, value, strong }: { label: string; value: number | undefined; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-base font-semibold text-ink" : "text-ink"}`}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd>{value === undefined ? "—" : formatMoney(value)}</dd>
    </div>
  );
}

function LineCard({
  line,
  onChange,
  onRemove,
}: {
  line: TakeOffLine;
  onChange: (patch: Partial<TakeOffLine>) => void;
  onRemove?: () => void;
}) {
  const problem = line.include ? lineProblem(line) : null;
  const isManual = line.source === "manual";

  return (
    <li className={`rounded-lg border bg-surface p-4 shadow-card ${line.include ? "border-line" : "border-line opacity-60"}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={line.include}
          onChange={(e) => onChange({ include: e.target.checked })}
          className="mt-1 h-4 w-4"
          aria-label={`Include ${line.name || "item"}`}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {line.category ? <span className="text-xs text-muted">{line.category}</span> : null}
            <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
              {line.item_type}
            </span>
          </div>

          {isManual ? (
            <input
              type="text"
              value={line.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={line.item_type === "service" ? "Service name" : "Item name"}
              className={inputClass}
              aria-label="Item name"
            />
          ) : (
            <p className="text-sm font-medium text-ink">{line.name}</p>
          )}

          {line.item_type !== "product" ? (
            <input
              type="text"
              value={line.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Description (optional)"
              className={inputClass}
              aria-label="Description"
            />
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="block text-xs text-muted">
              Qty
              <input
                type="number"
                min={0}
                step="any"
                value={line.quantity}
                onChange={(e) => onChange({ quantity: Number(e.target.value) })}
                className={inputClass}
              />
            </label>
            <label className="block text-xs text-muted">
              Unit price
              <input
                type="number"
                min={0}
                step="any"
                value={line.unit_price}
                onChange={(e) => onChange({ unit_price: Number(e.target.value) })}
                className={inputClass}
              />
            </label>
            <label className="block text-xs text-muted">
              Discount
              <select
                value={line.discount_type}
                onChange={(e) => onChange({ discount_type: e.target.value as DiscountType })}
                className={inputClass}
              >
                <option value="none">None</option>
                <option value="percentage">%</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>
            <label className="block text-xs text-muted">
              Discount value
              <input
                type="number"
                min={0}
                step="any"
                value={line.discount_value}
                disabled={line.discount_type === "none"}
                onChange={(e) => onChange({ discount_value: Number(e.target.value) })}
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink">Line total {formatMoney(lineTotal(line))}</span>
            {onRemove ? (
              <button type="button" onClick={onRemove} className="text-sm text-muted underline hover:text-ink">
                Remove
              </button>
            ) : null}
          </div>

          {problem ? <p className="text-xs text-red-600">{problem}</p> : null}
        </div>
      </div>
    </li>
  );
}
