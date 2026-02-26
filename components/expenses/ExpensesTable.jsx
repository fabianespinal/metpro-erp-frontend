export default function ExpensesTable({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return (
      <div className="p-4 text-gray-500">
        No hay gastos registrados todavía.
      </div>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead className="bg-gray-50">
        <tr>
          <th className="p-3 text-left">Fecha</th>
          <th className="p-3 text-left">Cliente</th>
          <th className="p-3 text-left">Categoría</th>
          <th className="p-3 text-left">Descripción</th>
          <th className="p-3 text-right">Monto</th>
          <th className="p-3 text-left">Proyecto</th>
          <th className="p-3 text-left">Cotización</th>
          <th className="p-3 text-right">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {expenses.map(exp => (
          <tr key={exp.expense_id} className="border-t hover:bg-gray-50">
            <td className="p-3">{exp.date}</td>
            <td className="p-3">{exp.client_name || "-"}</td>
            <td className="p-3">{exp.category}</td>
            <td className="p-3">{exp.description || "-"}</td>

            <td className="p-3 text-right font-bold">
              ${Number(exp.amount).toFixed(2)}
            </td>

            <td className="p-3">{exp.project_id || "-"}</td>
            <td className="p-3">{exp.quote_id || "-"}</td>

            <td className="p-3 text-right">
              <button
                onClick={() => onDelete(exp.expense_id)}
                className="text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}