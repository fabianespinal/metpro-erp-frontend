export default function ExpensesSummary({ expenses }) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Resumen de Gastos</h2>

      <div className="text-3xl font-bold text-blue-700">
        ${total.toFixed(2)}
      </div>

      <p className="text-gray-600 mt-1">Total acumulado</p>
    </div>
  );
}