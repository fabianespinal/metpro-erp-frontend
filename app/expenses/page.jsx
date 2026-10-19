'use client';

import { es } from "@/lib/i18n/es";
import toast from "react-hot-toast"
import ErrorBanner from "@/components/ui/ErrorBanner";
import { useState, useEffect } from "react";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import ExpensesTable from "@/components/expenses/ExpensesTable";
import { api } from "@/lib/api";
import ExpensesFilters from "@/components/expenses/ExpensesFilters";
import ExpensesSummary from "@/components/expenses/ExpensesSummary";
import ExpensesChart from "@/components/expenses/ExpensesChart";
import { PageHeader } from "@/components/ui/page-header";
import { useCurrentRole } from "@/lib/currentRole";

export default function ExpensesPage() {
  // Delete is admin only (API enforces the same rule).
  const { isAdmin } = useCurrentRole();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadError, setLoadError] = useState(null)
  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
    loadProjects();
    loadExpenses();
  }, []);

  // -----------------------------
  // LOAD CLIENTS
  // -----------------------------
  async function loadClients() {
    try {
      const data = await api.get("/clients");
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading clients:", err);
      setClients([]);
      setLoadError(`No se pudieron cargar los clientes: ${err.message}`);
    }
  }

  // Projects for the "Proyecto (opcional)" dropdown and the filter.
  async function loadProjects() {
    try {
      const data = await api.get("/projects/");
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading projects:", err);
      setProjects([]);
    }
  }

  // -----------------------------
  // LOAD EXPENSES
  // -----------------------------
  async function loadExpenses() {
    try {
      const data = await api.get("/expenses");
      setExpenses(Array.isArray(data) ? data : []);
      setFiltered(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading expenses:", err);
      setExpenses([]);
      setFiltered([]);
      setLoadError(`No se pudieron cargar los gastos: ${err.message}`);
    }
  }

  // -----------------------------
  // FILTER LOGIC
  // -----------------------------
  function applyFilters(filters) {
    let result = [...expenses];

    if (filters.category) {
      result = result.filter(
        e => e.category.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.dateFrom) {
      result = result.filter(e => new Date(e.date) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      result = result.filter(e => new Date(e.date) <= new Date(filters.dateTo));
    }

    if (filters.project_id === "none") {
      result = result.filter(e => e.project_id == null);
    } else if (filters.project_id) {
      result = result.filter(e => String(e.project_id ?? "") === String(filters.project_id));
    }

    if (filters.quote_id) {
      result = result.filter(
        e => (e.quote_id || "").toLowerCase() === filters.quote_id.toLowerCase()
      );
    }

    setFiltered(result);
  }

  // -----------------------------
  // CREATE EXPENSE
  // -----------------------------
  async function handleCreateExpense(formData) {
    setLoading(true);

    // REMOVE client_id if present
    if ("client_id" in formData) {
      delete formData.client_id;
    }

    // quote_id stays free text. project_id is a project number from the dropdown, or none.
    if (formData.quote_id !== undefined && formData.quote_id !== null) {
      formData.quote_id = String(formData.quote_id);
    }
    formData.project_id = formData.project_id ? Number(formData.project_id) : null;

    try {
      await api.post("/expenses/", formData);
      await loadExpenses();
      toast.success(es.gas.creado);
    } catch (e) {
      toast.error(es.gas.errorCrear + e.message);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // DELETE EXPENSE
  // -----------------------------
  async function handleDeleteExpense(id) {
    if (!confirm(es.gas.confirmarEliminar)) return;

    try {
      await api.delete(`/expenses/${id}`);
      await loadExpenses();
    } catch (e) {
      toast.error(es.gas.errorEliminar + e.message);
    }
  }

  // -----------------------------
  // EXPORT CSV
  // -----------------------------
  function exportExpensesCSV(expensesToExport) {
    if (!expensesToExport || expensesToExport.length === 0) {
      toast.error(es.gas.nadaQueExportar);
      return;
    }

    let csv = es.gas.csvEncabezado;

    expensesToExport.forEach(exp => {
      csv += [
        exp.date,
        exp.category,
        exp.description ? `"${exp.description.replace(/"/g, '""')}"` : "",
        exp.amount,
        exp.payment_method ?? "",
        exp.project_number ? `"${exp.project_number} ${String(exp.project_name ?? "").replace(/"/g, '""')}"` : "",
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
      <PageHeader title={es.gas.titulo} />
      <ErrorBanner message={loadError} />

      <ExpenseForm
        clients={clients}
        projects={projects}
        onSubmit={handleCreateExpense}
        loading={loading}
      />

      <ExpensesFilters onFilter={applyFilters} projects={projects} />

      <ExpensesSummary expenses={filtered} />

      <ExpensesChart expenses={filtered} />

      <div className="bg-surface rounded-lg shadow p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{es.gas.registrados}</h2>

          <button
            onClick={() => exportExpensesCSV(filtered)}
            className="bg-accent text-white px-4 py-2 rounded hover:bg-accent-strong"
          >
            {es.gas.exportarCsv}
          </button>
        </div>

        <ExpensesTable
          expenses={filtered}
          onDelete={isAdmin ? handleDeleteExpense : undefined}
        />
      </div>
    </div>
  );
}