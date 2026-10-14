'use client';
import { fb } from "@/components/ui/filter-bar";

import { useState } from "react";

export default function ExpensesFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    category: "",
    dateFrom: "",
    dateTo: "",
    project_id: "",
    quote_id: ""
  });

  function handleChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function apply() {
    onFilter(filters);
  }

  return (
    <div className="mb-6 rounded-lg border border-line bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-base font-semibold text-ink">Filtros</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Categoría */}
        <div>
          <label className={fb.label}>Categoría</label>
          <input
            name="category"
            value={filters.category}
            onChange={handleChange}
            className={fb.control}
            placeholder="Combustible, Herramientas, Reparaciones..."
          />
        </div>

        {/* Fecha Desde */}
        <div>
          <label className={fb.label}>Fecha Desde</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleChange}
            className={fb.control}
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <label className={fb.label}>Fecha Hasta</label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleChange}
            className={fb.control}
          />
        </div>

        {/* Proyecto (solo referencia, módulo independiente) */}
        <div>
          <label className={fb.label}>Proyecto (referencia opcional)</label>
          <input
            name="project_id"
            value={filters.project_id}
            onChange={handleChange}
            className={fb.control}
            placeholder="Texto o ID opcional"
          />
        </div>

        {/* Cotización (solo referencia, módulo independiente) */}
        <div>
          <label className={fb.label}>Cotización (referencia opcional)</label>
          <input
            name="quote_id"
            value={filters.quote_id}
            onChange={handleChange}
            className={fb.control}
            placeholder="Texto o ID opcional"
          />
        </div>

      </div>

      <button
        onClick={apply}
        className="mt-4 bg-accent text-white px-4 py-2 rounded hover:bg-accent-strong"
      >
        Aplicar Filtros
      </button>
    </div>
  );
}