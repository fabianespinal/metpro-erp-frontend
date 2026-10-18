import { es } from "@/lib/i18n/es";
import { dt } from "@/components/ui/data-table";
import { money } from "@/lib/money";

const t = es.led;

/** Gastos por Categoría: totals by category with assigned vs unassigned split. */
export default function ExpensesByCategoryReport({ data }) {
  const s = data?.summary || {};
  const rows = data?.categories || [];
  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          [t.totalGastos, money(s.total_expenses)],
          [t.cantidadGastos, s.count ?? 0],
          [t.asignado, money(s.assigned_to_projects)],
          [t.sinAsignar, money(s.unassigned)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-surface p-4 text-center shadow-card">
            <div className="text-xl font-semibold tabular-nums text-ink">{value}</div>
            <div className="mt-1 text-sm text-muted">{label}</div>
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t.sinDatos}</p>
      ) : (
        <div className={dt.wrap}>
          <table className={dt.table}>
            <thead className={dt.thead}>
              <tr>
                <th className={dt.th}>{t.colCategoria}</th>
                <th className={dt.thRight}>{t.colCantidad}</th>
                <th className={dt.thRight}>{t.colMonto}</th>
                <th className={dt.thRight}>{t.colPorcentaje}</th>
              </tr>
            </thead>
            <tbody className={dt.tbody}>
              {rows.map((c) => (
                <tr key={c.category} className={dt.tr}>
                  <td className={dt.td}>{c.category}</td>
                  <td className={dt.tdRight}>{c.count}</td>
                  <td className={dt.tdRight}>{money(c.total)}</td>
                  <td className={dt.tdRight}>{c.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function categoriesCsv(data) {
  let csv = t.csvCategorias;
  (data?.categories || []).forEach((c) => {
    csv += [`"${String(c.category).replace(/"/g, '""')}"`, c.total.toFixed(2), c.count, `${c.percentage.toFixed(2)}%`].join(",") + "\n";
  });
  return csv;
}
