export default function ExpensesSummary({ expenses }) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Summary</h2>

      <div className="text-2xl font-bold text-blue-700">
        Total Expenses: ${total.toFixed(2)}
      </div>
    </div>
  );
}