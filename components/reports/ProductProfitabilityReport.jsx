import { es } from "@/lib/i18n/es";
import { dt } from "@/components/ui/data-table";
import { money } from "@/lib/money";

const t = es.cst;
const pct = (v) => (v === null || v === undefined ? "—" : `${v.toFixed(1)}%`);
const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Rentabilidad de Productos: price, current cost, unit margin and margin % per catalog product. */
export default function ProductProfitabilityReport({ data }) {
  const s = data?.summary || {};
  const rows = data?.products || [];
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          [t.conCosto, s.with_cost ?? 0],
          [t.sinCosto, s.without_cost ?? 0],
          [t.margenNegativo, s.negative_margin ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-surface p-4 text-center shadow-card">
            <div className="text-xl font-semibold tabular-nums text-ink">{value}</div>
            <div className="mt-1 text-sm text-muted">{label}</div>
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{es.led.sinDatos}</p>
      ) : (
        <div className={`${dt.wrap} overflow-x-auto`}>
          <table className={dt.table}>
            <thead className={dt.thead}>
              <tr>
                <th className={dt.th}>{t.colProducto}</th>
                <th className={dt.thRight}>{t.colPrecio}</th>
                <th className={dt.thRight}>{t.colCosto}</th>
                <th className={dt.thRight}>{t.colMargen}</th>
                <th className={dt.thRight}>{t.colMargenPct}</th>
              </tr>
            </thead>
            <tbody className={dt.tbody}>
              {rows.map((p) => (
                <tr key={p.product_id} className={dt.tr}>
                  <td className={dt.td}>
                    {p.name}
                    {p.description ? <div className="text-xs text-muted">{p.description}</div> : null}
                  </td>
                  <td className={dt.tdRight}>{money(p.unit_price)}</td>
                  <td className={dt.tdRight}>{p.cost === null ? <span className="text-xs text-amber-700">{t.sinCosto}</span> : money(p.cost)}</td>
                  <td className={`${dt.tdRight} ${p.margin !== null && p.margin < 0 ? "text-red-600" : ""}`}>
                    {p.margin === null ? "—" : money(p.margin)}
                  </td>
                  <td className={dt.tdRight}>{pct(p.margin_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function productsCsv(data) {
  let csv = t.csvProductos;
  (data?.products || []).forEach((p) => {
    csv += [
      q(p.name),
      q(p.description),
      p.unit_price.toFixed(2),
      p.cost === null ? "" : p.cost.toFixed(2),
      p.margin === null ? "" : p.margin.toFixed(2),
      p.margin_pct === null ? "" : p.margin_pct.toFixed(2),
    ].join(",") + "\n";
  });
  return csv;
}
