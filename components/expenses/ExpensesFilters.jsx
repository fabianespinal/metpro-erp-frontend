'use client'
import { useState } from "react";

export default function ExpensesFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    category: "",
    dateFrom: "",
    dateTo: "",
    projectId: "",
    quoteId: ""
  });

  function handleChange(e) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  function apply() {
    onFilter(filters);
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div>
          <label className="block mb-1 font-medium">Category</label>
          <input
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Fuel, Tools, Repairs..."
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Date From</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Date To</label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Project ID</label>
          <input
            name="projectId"
            value={filters.projectId}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Quote ID</label>
          <input
            name="quoteId"
            value={filters.quoteId}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Optional"
          />
        </div>

      </div>

      <button
        onClick={apply}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Apply Filters
      </button>
    </div>
  );
}