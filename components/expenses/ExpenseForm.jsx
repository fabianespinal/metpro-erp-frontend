'use client'
import { useState } from "react";

export default function ExpenseForm({ clients, onSubmit, loading }) {
  const [form, setForm] = useState({
    date: "",
    category: "",
    description: "",
    amount: "",
    payment_method: "",
    project_id: "",
    quote_id: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Add Expense</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div>
          <label className="block mb-1 font-medium">Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Category</label>
          <input
            type="text"
            name="category"
            placeholder="Fuel, Tools, Repairs..."
            value={form.category}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Cliente</label>
          <input
            type="text"
            name="cliente"
            placeholder="nombre cliente..."
            value={form.cliente}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Amount ($)</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Payment Method</label>
          <input
            type="text"
            name="payment_method"
            placeholder="Cash, Transfer, Card"
            value={form.payment_method}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Project ID (optional)</label>
          <input
            type="text"
            name="project_id"
            value={form.project_id}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Quote ID (optional)</label>
          <input
            type="text"
            name="quote_id"
            value={form.quote_id}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

      </div>

      <div className="mt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Add Expense"}
        </button>
      </div>
    </form>
  );
}