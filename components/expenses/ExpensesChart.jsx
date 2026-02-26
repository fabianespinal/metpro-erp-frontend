"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function ExpensesChart({ expenses }) {
  const monthlyTotals = {};

  expenses.forEach(e => {
    const month = e.date?.slice(0, 7); // YYYY-MM
    if (!month) return;
    monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(e.amount || 0);
  });

  const labels = Object.keys(monthlyTotals);
  const data = Object.values(monthlyTotals);

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Gastos Mensuales</h2>

      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Total de Gastos ($)",
              data,
              backgroundColor: "rgba(37, 99, 235, 0.6)",
              borderColor: "rgba(37, 99, 235, 1)",
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        }}
        options={{
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: "top"
            },
            tooltip: {
              callbacks: {
                label: context =>
                  `$${context.raw.toLocaleString("en-US")}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => `$${value}`
              }
            }
          }
        }}
      />
    </div>
  );
}