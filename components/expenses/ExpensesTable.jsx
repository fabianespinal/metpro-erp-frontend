export default function ExpensesTable({ expenses, onDelete }) {
  if (expenses.length === 0) {
    return <div className="p-4 text-gray-500">No expenses recorded yet.</div>;
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="p-3 text-left">Date</th>
          <th className="p-3 text-left">Client</th>
          <th className="p-3 text-left">Category</th>
          <th className="p-3 text-left">Description</th>
          <th className="p-3 text-right">Amount</th>
          <th className="p-3 text-left">Project</th>
          <th className="p-3 text-left">Quote</th>
          <th className="p-3 text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {expenses.map(exp => (
          <tr key={exp.expense_id} className="border-t hover:bg-gray-50">
            <td className="p-3">{exp.date}</td>
            <td className="p-3">{exp.client_id || "-"}</td>
            <td className="p-3">{exp.category}</td>
            <td className="p-3">{exp.description || "-"}</td>
            <td className="p-3 text-right font-bold">${Number(exp.amount).toFixed(2)}</td>
            <td className="p-3">{exp.project_id || "-"}</td>
            <td className="p-3">{exp.quote_id || "-"}</td>

            <td className="p-3 text-right">
              <button
                onClick={() => onDelete(exp.expense_id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}