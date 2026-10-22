import { es } from "@/lib/i18n/es";
import { dt } from "@/components/ui/data-table";
import { money } from "@/lib/money";

const t = es.cpr;

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

function Row({ r, label, sub }) {
  return (
    <tr className={dt.tr}>
      <td className={`${dt.td} ${sub ? "pl-8 text-muted" : "font-medium"}`}>{label}</td>
      <td className={dt.tdRight}>{money(r.revenue)}</td>
      <td className={dt.tdRight}>{money(r.cogs)}</td>
      <td className={`${dt.tdRight} ${tone(r.gross_profit)}`}>{money(r.gross_profit)}</td>
      <td className={`${dt.tdRight} ${tone(r.gross_profit)}`}>{pct(r.profit_pct)}</td>
      <td className={dt.tdRight}>{money(r.outstanding)}</td>
      <td className={dt.tdRight}>{pct(r.cost_coverage_pct)}</td>
    </tr>
  );
}

/** Rentabilidad por Cliente (Fase 1): ingreso sin impuesto, COGS, utilidad bruta, % y saldo pendiente. */
export default function ClientProfitabilityReport({ data }) {
  const s = data?.summary || {};
  const rows = data?.clients || [];
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card label={t.colIngreso} value={money(s.revenue)} />
        <Card label={t.colCogs} value={money(s.cogs)} />
        <Card label={t.colUtilidad} value={money(s.gross_profit)} tone={tone(s.gross_profit)} />
        <Card label={t.colPct} value={pct(s.profit_pct)} tone={tone(s.gross_profit)} />
        <Card label={t.colPendiente} value={money(s.outstanding)} />
      </div>
      <p className="mb-4 text-xs text-muted">{t.nota}</p>
      {s.unlinked_expenses && s.unlinked_expenses.count > 0 && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
          {t.avisoGastos(s.unlinked_expenses.count, money(s.unlinked_expenses.amount))}
        </p>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t.sinDatos}</p>
      ) : (
        <div className={`${dt.wrap} overflow-x-auto`}>
          <table className={dt.table}>
            <thead className={dt.thead}>
              <tr>
                <th className={dt.th}>{t.colCliente}</th>
                <th className={dt.thRight}>{t.colIngreso}</th>
                <th className={dt.thRight}>{t.colCogs}</th>
                <th className={dt.thRight}>{t.colUtilidad}</th>
                <th className={dt.thRight}>{t.colPct}</th>
                <th className={dt.thRight}>{t.colPendiente}</th>
                <th className={dt.thRight}>{t.colCobertura}</th>
              </tr>
            </thead>
            <tbody className={dt.tbody}>
              {rows.map((c) => [
                <Row key={`c${c.client_id}`} r={c} label={c.client_name} />,
                ...c.breakdown.map((b) => (
                  <Row key={`c${c.client_id}-${b.project_id ?? "g"}`} r={b} sub label={b.project_id === null ? t.general : b.name} />
                )),
              ])}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function clientProfitabilityCsv(data) {
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  let csv = t.csv;
  const line = (client, area, r) =>
    [q(client), q(area), r.revenue.toFixed(2), r.product_cost.toFixed(2), r.direct_costs.toFixed(2), r.cogs.toFixed(2),
      r.gross_profit.toFixed(2), r.profit_pct === null ? "" : r.profit_pct.toFixed(2), r.outstanding.toFixed(2),
      r.cost_coverage_pct === null ? "" : r.cost_coverage_pct.toFixed(2)].join(",") + "\n";
  (data?.clients || []).forEach((c) => {
    csv += line(c.client_name, "", c);
    c.breakdown.forEach((b) => {
      csv += line(c.client_name, b.project_id === null ? t.general : b.name, b);
    });
  });
  return csv;
}
