import { dt } from "@/components/ui/data-table";
import { fmtDay } from "@/lib/dates"
import { money } from "@/lib/money"
export default function ExpensesTable({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return (
      <div className="p-4 text-muted">
        No hay gastos registrados todavía.
      </div>
    );
  }

  return (
    // E-04: scroll inside the card on phones.
    <div className="overflow-x-auto">
    <table className={dt.table}>
      <thead className={dt.thead}>
        <tr>
          <th className={dt.th}>Fecha</th>
          <th className={dt.th}>Cliente</th>
          <th className={dt.th}>Categoría</th>
          <th className={dt.th}>Descripción</th>
          <th className={dt.thRight}>Monto</th>
          <th className={dt.th}>Proyecto</th>
          <th className={dt.th}>Cotización</th>
          <th className={dt.thRight}>Acciones</th>
        </tr>
      </thead>

      <tbody className={dt.tbody}>
        {expenses.map(exp => (
          <tr key={exp.expense_id} className={dt.tr}>
            <td className={dt.td}>{fmtDay(exp.date)}</td>
            <td className={dt.td}>{exp.client_name || "-"}</td>
            <td className={dt.td}>{exp.category}</td>
            <td className={dt.td}>{exp.description || "-"}</td>

            <td className={dt.tdRight}>
              {money(Number(exp.amount))}
            </td>

            <td className={dt.td}>
              {exp.project_id ? (
                <a
                  href={`/proyectos/${exp.project_id}`}
                  title={exp.project_name || ""}
                  className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200 hover:underline"
                >
                  {exp.project_number || `P-${exp.project_id}`}{exp.project_name ? ` · ${exp.project_name}` : ""}
                </a>
              ) : "-"}
            </td>
            <td className={dt.td}>{exp.quote_id || "-"}</td>

            <td className={dt.tdRight}>
              {onDelete && (
                <button
                  onClick={() => onDelete(exp.expense_id)}
                  className="text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}