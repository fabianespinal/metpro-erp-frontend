'use client'
import { useState, useEffect } from "react";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpensesTable from "@/components/expenses/ExpensesTable";
import { fetchExpenses, createExpense, deleteExpense } from "@/components/expenses/expenseApi";
import { api } from "@/lib/api";
import ExpensesFilters from "@/components/expenses/ExpensesFilters";
import ExpensesSummary from "@/components/expenses/ExpensesSummary";
import ExpensesChart from "@/components/expenses/ExpensesChart";

export default function ExpensesPage() {
  const [clients, setClients] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
    loadExpenses();
  }, []);

  async function loadClients() {
    try {
      const data = await api("/clients/", { method: "GET" });
      setClients(Array.isArray(data) ? data : []);
    } catch {
      setClients([]);
    }
  }

  async function loadExpenses() {
    try {
      const data = await fetchExpenses();
      setExpenses(Array.isArray(data) ? data : []);
      setFiltered(Array.isArray(data) ? data : []);
    } catch {
      setExpenses([]);
      setFiltered([]);
    }
  }

  function applyFilters(filters) {
    let result = [...expenses];

    if (filters.category) {
      result = result.filter(e => e.category.toLowerCase() === filters.category.toLowerCase());
    }

    if (filters.dateFrom) {
      result = result.filter(e => new Date(e.date) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      result = result.filter(e => new Date(e.date) <= new Date(filters.dateTo));
    }

    if (filters.projectId) {
      result = result.filter(e => (e.project_id || "").toLowerCase() === filters.projectId.toLowerCase());
    }

    if (filters.quoteId) {
      result = result.filter(e => (e.quote_id || "").toLowerCase() === filters.quoteId.toLowerCase());
    }

    setFiltered(result);
  }

  async function handleCreateExpense(formData) {
    setLoading(true);
    try {
      await createExpense(formData);
      loadExpenses();
      alert("Expense added successfully!");
    } catch (e) {
      alert("Error creating expense: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteExpense(id) {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      loadExpenses();
    } catch (e) {
      alert("Error deleting expense: " + e.message);
    }
  }

  function exportExpensesCSV(expensesToExport) {
    if (!expensesToExport || expensesToExport.length === 0) {
      alert("No expenses to export");
      return;
    }

    let csv = "Date,Client ID,Category,Description,Amount,Payment Method,Project ID,Quote ID\n";

    expensesToExport.forEach(exp => {
      csv += [
        exp.date,
        exp.client_id ?? "",
        exp.category,
        exp.description ? `"${exp.description.replace(/"/g, '""')}"` : "",
        exp.amount,
        exp.payment_method ?? "",
        exp.project_id ?? "",
        exp.quote_id ?? ""
      ].join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "expenses_export.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full px-4 lg:px-8 py-6">
      <h1 className="text-2xl font-bold mb-6">Expenses</h1>

      <ExpenseForm
        clients={clients}
        onSubmit={handleCreateExpense}
        loading={loading}
      />

      <ExpensesFilters onFilter={applyFilters} />

      <ExpensesSummary expenses={filtered} />

      <ExpensesChart expenses={filtered} />

      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recorded Expenses</h2>

          <button
            onClick={() => exportExpensesCSV(filtered)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>

        <ExpensesTable
          expenses={filtered}
          onDelete={handleDeleteExpense}
        />
      </div>
    </div>
  );
}
