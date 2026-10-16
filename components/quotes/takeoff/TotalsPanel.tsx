"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { IncludedCharges, TotalsPreview } from "@/lib/quotingApi";
import { TotalRow } from "@/components/quotes/takeoff/LineCard";

export type ChargeKey = "supervision" | "admin" | "insurance" | "transport" | "contingency";

const CHARGE_LABELS: { key: ChargeKey; label: string }[] = [
  { key: "supervision", label: "Supervision" },
  { key: "admin", label: "Admin" },
  { key: "insurance", label: "Insurance" },
  { key: "transport", label: "Transport" },
  { key: "contingency", label: "Contingency" },
];

/** Included charges (toggle + editable percentage) and the server-computed totals. */
export function TotalsPanel({
  charges,
  onToggleCharge,
  onChangePercentage,
  totals,
  totalsError,
  includedCount,
}: {
  charges: IncludedCharges;
  onToggleCharge: (key: keyof IncludedCharges) => void;
  /** When given, each charge shows an editable percentage (0-100). */
  onChangePercentage?: (key: ChargeKey, value: number) => void;
  totals: TotalsPreview | null;
  totalsError: string | null;
  includedCount: number;
}) {
  return (
    <>
      <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-ink">Included charges</h2>
        <div className="space-y-2">
          {CHARGE_LABELS.map(({ key, label }) => {
            const pctKey = `${key}_percentage` as keyof IncludedCharges;
            const pct = Number(charges[pctKey] ?? 0);
            return (
              <div key={key} className="flex items-center justify-between gap-2 text-sm text-ink">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(charges[key])}
                    onChange={() => onToggleCharge(key)}
                    className="h-4 w-4"
                  />
                  {label}
                </label>
                {onChangePercentage ? (
                  <span className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={Number.isFinite(pct) ? pct : 0}
                      disabled={!charges[key]}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v)) onChangePercentage(key, Math.min(100, Math.max(0, v)));
                      }}
                      aria-label={`${label} percentage`}
                      className="w-20 rounded border border-line px-2 py-1 text-right disabled:opacity-50"
                    />
                    <span className="text-muted">%</span>
                  </span>
                ) : (
                  <span className="text-muted">{pct}%</span>
                )}
              </div>
            );
          })}
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
    </>
  );
}
