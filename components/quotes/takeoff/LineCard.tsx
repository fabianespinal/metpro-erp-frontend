"use client";

import { es } from "@/lib/i18n/es";
import { formatMoney, lineProblem, lineTotal, type TakeOffLine } from "@/lib/takeOffLines";
import type { DiscountType } from "@/lib/quotingApi";
import { usePdfOptions } from "@/lib/pdfOptions";
import { UnitInput } from "@/components/quotes/UnitInput";

export const takeOffInputClass =
  "w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";

export function TotalRow({ label, value, strong }: { label: string; value: number | undefined; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "text-base font-semibold text-ink" : "text-ink"}`}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd>{value === undefined ? "—" : formatMoney(value)}</dd>
    </div>
  );
}

export function LineCard({
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
  const { medidas_enabled } = usePdfOptions();

  return (
    <li className={`rounded-lg border bg-surface p-4 shadow-card ${line.include ? "border-line" : "border-line opacity-60"}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={line.include}
          onChange={(e) => onChange({ include: e.target.checked })}
          className="mt-1 h-4 w-4"
          aria-label={es.cot.incluir(line.name || es.cot.articuloGenerico)}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {line.category ? <span className="text-xs text-muted">{line.category}</span> : null}
            <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
              {es.cot.tiposLinea[line.item_type] ?? line.item_type}
            </span>
          </div>

          {isManual ? (
            <input
              type="text"
              value={line.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={line.item_type === "service" ? es.cot.nombreServicio : es.cot.nombreArticulo}
              className={takeOffInputClass}
              aria-label={es.cot.nombreArticulo}
            />
          ) : (
            <p className="text-sm font-medium text-ink">{line.name}</p>
          )}

          {line.item_type !== "product" ? (
            <input
              type="text"
              value={line.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder={es.cot.descripcionOpcional}
              className={takeOffInputClass}
              aria-label={es.cot.descripcion}
            />
          ) : null}

          <div className={`grid grid-cols-2 gap-3 ${medidas_enabled ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
            {medidas_enabled ? (
              <label className="block text-xs text-muted">
                {es.pdf.medidas}
                <UnitInput
                  value={line.unit_of_measure ?? ""}
                  onChange={(v) => onChange({ unit_of_measure: v })}
                  label={es.pdf.medidas}
                  className={takeOffInputClass}
                />
              </label>
            ) : null}
            <label className="block text-xs text-muted">
              {es.cot.cantAbrev}
              <input
                type="number"
                min={0}
                step="any"
                value={line.quantity}
                onChange={(e) => onChange({ quantity: Number(e.target.value) })}
                className={takeOffInputClass}
              />
            </label>
            <label className="block text-xs text-muted">
              {es.cot.precioUnitarioLabel}
              <input
                type="number"
                min={0}
                step="any"
                value={line.unit_price}
                onChange={(e) => onChange({ unit_price: Number(e.target.value) })}
                className={takeOffInputClass}
              />
            </label>
            <label className="block text-xs text-muted">
              {es.cot.descuento}
              <select
                value={line.discount_type}
                onChange={(e) => onChange({ discount_type: e.target.value as DiscountType })}
                className={takeOffInputClass}
              >
                <option value="none">{es.cot.ninguno}</option>
                <option value="percentage">%</option>
                <option value="fixed">{es.cot.fijo}</option>
              </select>
            </label>
            <label className="block text-xs text-muted">
              {es.cot.valorDesc}
              <input
                type="number"
                min={0}
                step="any"
                value={line.discount_value}
                disabled={line.discount_type === "none"}
                onChange={(e) => onChange({ discount_value: Number(e.target.value) })}
                className={takeOffInputClass}
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink">{es.cot.totalLineaValor(formatMoney(lineTotal(line)))}</span>
            {onRemove ? (
              <button type="button" onClick={onRemove} className="text-sm text-muted underline hover:text-ink">
                {es.cot.quitar}
              </button>
            ) : null}
          </div>

          {problem ? <p className="text-xs text-red-600">{problem}</p> : null}
        </div>
      </div>
    </li>
  );
}
