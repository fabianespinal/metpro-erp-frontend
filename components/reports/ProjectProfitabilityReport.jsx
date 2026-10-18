import { es } from "@/lib/i18n/es";
import { dt } from "@/components/ui/data-table";
import { money } from "@/lib/money";

const t = es.led;

function Card({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 text-center shadow-card">
      <div className={`text-xl font-semibold tabular-nums ${tone || "text-ink"}`}>{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

const pct = (v) => (v === null || v === undefined ? "—" : `${Number(v).toFixed(1)}%`);
const tone = (v) => (Number(v) < 0 ? "text-red-600" : "text-ink");

/** Rentabilidad del Proyecto: per-project billed, paid, expenses and margins. */
export default function ProjectProfitabilityReport({ data }) {
  const s = data?.summary || {};
  const rows = data?.projects || [];
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card label={t.colFacturado} value={money(s.total_billed)} />
        <Card label={t.colCobrado} value={money(s.total_paid)} />
        <Card label={t.colGastos} value={money(s.total_expenses)} />
        <Card label={t.colMargen} value={money(s.net_margin)} tone={tone(s.net_margin)} />
        <Card label={t.colMargenPct} value={pct(s.margin_pct)} tone={tone(s.net_margin)} />
      </div>
      <p className="mb-4 text-xs text-muted">{t.notaMargen}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t.sinDatos}</p>
      ) : (
        <div className={`${dt.wrap} overflow-x-auto`}>
          <table className={dt.table}>
            <thead className={dt.thead}>
              <tr>
                <th className={dt.th}>{t.colProyecto}</th>
                <th className={dt.th}>{t.colCliente}</th>
                <th className={dt.thRight}>{t.colFacturado}</th>
                <th className={dt.thRight}>{t.colCobrado}</th>
                <th className={dt.thRight}>{t.colPendiente}</th>
                <th className={dt.thRight}>{t.colGastos}</th>
                <th className={dt.thRight}>{t.colMargen}</th>
                <th className={dt.thRight}>{t.colMargenPct}</th>
                <th className={dt.th}>{t.colCategorias}</th>
              </tr>
            </thead>
            <tbody className={dt.tbody}>
              {rows.map((p) => (
                <tr key={p.project_id} className={dt.tr}>
                  <td className={dt.td}>
                    <a href={`/proyectos/${p.project_id}`} className="text-accent hover:underline">
                      {p.project_number}
                    </a>{" "}
                    {p.name}
                    {p.quote_label ? <div className="text-xs text-muted">{p.quote_label}</div> : null}
                  </td>
                  <td className={dt.td}>{p.client_name}</td>
                  <td className={dt.tdRight}>{money(p.billed)}</td>
                  <td className={dt.tdRight}>{money(p.paid)}</td>
                  <td className={dt.tdRight}>{money(p.outstanding)}</td>
                  <td className={dt.tdRight}>{money(p.expenses)}</td>
                  <td className={`${dt.tdRight} ${tone(p.net_margin)}`}>{money(p.net_margin)}</td>
                  <td className={`${dt.tdRight} ${tone(p.net_margin)}`}>{pct(p.margin_pct)}</td>
                  <td className={dt.td}>
                    {p.expense_categories.length === 0
                      ? "—"
                      : p.expense_categories.map((c) => `${c.category} ${money(c.total)}`).join(" · ")}
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

export function profitabilityCsv(data) {
  let csv = t.csvRentabilidad;
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  (data?.projects || []).forEach((p) => {
    csv += [p.project_number, q(p.name), q(p.client_name), p.quote_label ?? "", p.billed.toFixed(2), p.billed_itbis.toFixed(2),
      p.paid.toFixed(2), p.outstanding.toFixed(2), p.expenses.toFixed(2), p.net_margin.toFixed(2),
      p.margin_pct === null ? "" : p.margin_pct.toFixed(2), p.cash_margin.toFixed(2)].join(",") + "\n";
  });
  return csv;
}
