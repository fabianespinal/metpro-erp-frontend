'use client';

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
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Filtros</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Categoría */}
        <div>
          <label className="block mb-1 font-medium">Categoría</label>
          <input
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Combustible, Herramientas, Reparaciones..."
          />
        </div>

        {/* Fecha Desde */}
        <div>
          <label className="block mb-1 font-medium">Fecha Desde</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <label className="block mb-1 font-medium">Fecha Hasta</label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Proyecto (solo referencia, módulo independiente) */}
        <div>
          <label className="block mb-1 font-medium">Proyecto (referencia opcional)</label>
          <input
            name="project_id"
            value={filters.project_id}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Texto o ID opcional"
          />
        </div>

        {/* Cotización (solo referencia, módulo independiente) */}
        <div>
          <label className="block mb-1 font-medium">Cotización (referencia opcional)</label>
          <input
            name="quote_id"
            value={filters.quote_id}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Texto o ID opcional"
          />
        </div>

      </div>

      <button
        onClick={apply}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Aplicar Filtros
      </button>
    </div>
  );
}