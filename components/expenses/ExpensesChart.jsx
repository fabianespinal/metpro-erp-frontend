"use client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale);

export default function ExpensesChart({ expenses }) {
  const monthlyTotals = {};

  expenses.forEach(e => {
    const month = e.date.slice(0, 7); // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(e.amount);
  });

  const labels = Object.keys(monthlyTotals);
  const data = Object.values(monthlyTotals);

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Monthly Expenses</h2>

      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Expenses ($)",
              data,
              backgroundColor: "rgba(37, 99, 235, 0.6)"
            }
          ]
        }}
      />
    </div>
  );
}