import { es } from "@/lib/i18n/es";
import { dt } from "@/components/ui/data-table";
import { money } from "@/lib/money";

const t = es.cst;
const pct = (v) => (v === null || v === undefined ? "—" : `${v.toFixed(1)}%`);
const m = (v) => (v === null || v === undefined ? "—" : money(v));
const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const n = (v) => (v === null || v === undefined ? "" : Number(v).toFixed(2));

/** Variación del Proyecto: estimated cost vs actual expenses, estimated vs actual margin (sin ITBIS). */
export default function ProjectVarianceReport({ data }) {
  const s = data?.summary || {};
  const rows = data?.projects || [];
  return (
    <div>
      <p className="mb-4 text-xs text-muted">{t.notaVariacion}</p>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          [t.colEstimado, money(s.total_estimated_cost)],
          [t.colGastos, money(s.total_expenses)],
          [t.colVariacion, money(s.total_variance)],
          [t.estimadosIncompletos, s.incomplete_estimates ?? 0],
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
                <th className={dt.th}>{es.led.colProyecto}</th>
                <th className={dt.thRight}>{t.colEstimado}</th>
                <th className={dt.thRight}>{t.colGastos}</th>
                <th className={dt.thRight}>{t.colVariacion}</th>
                <th className={dt.thRight}>{t.colMargenEst}</th>
                <th className={dt.thRight}>{t.colMargenReal}</th>
                <th className={dt.thRight}>{t.colPrecision}</th>
                <th className={dt.thRight}>{t.colCobertura}</th>
              </tr>
            </thead>
            <tbody className={dt.tbody}>
              {rows.map((r) => (
                <tr key={r.project_id} className={dt.tr}>
                  <td className={dt.td}>
                    {r.project_number} · {r.name}
                    <div className="text-xs text-muted">
                      {r.client_name}
                      {r.quote_label ? ` · ${r.quote_label}` : ""}
                    </div>
                  </td>
                  <td className={dt.tdRight}>{money(r.estimated_cost)}</td>
                  <td className={dt.tdRight}>{money(r.expenses)}</td>
                  <td className={`${dt.tdRight} ${r.variance < 0 ? "text-red-600" : ""}`}>
                    {money(r.variance)}
                    <div className="text-xs text-muted">{pct(r.variance_pct)}</div>
                  </td>
                  <td className={dt.tdRight}>{m(r.estimated_margin)}</td>
                  <td className={dt.tdRight}>{m(r.actual_margin)}</td>
                  <td className={dt.tdRight}>{pct(r.margin_accuracy_pct)}</td>
                  <td className={`${dt.tdRight} ${r.has_quote && r.lines_costed < r.lines_total ? "text-amber-700" : ""}`}>
                    {r.has_quote ? `${r.lines_costed}/${r.lines_total}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function varianceCsv(data) {
  let csv = t.csvVariacion;
  (data?.projects || []).forEach((r) => {
    csv += [
      r.project_number,
      q(r.name),
      q(r.client_name),
      r.quote_label ?? "",
      n(r.estimated_cost),
      n(r.expenses),
      n(r.variance),
      n(r.variance_pct),
      n(r.estimated_margin),
      n(r.actual_margin),
      n(r.margin_accuracy_pct),
      r.has_quote ? `${r.lines_costed}/${r.lines_total}` : "",
    ].join(",") + "\n";
  });
  return csv;
}
