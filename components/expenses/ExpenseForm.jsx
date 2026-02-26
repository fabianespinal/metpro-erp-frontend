'use client';

import { useState } from "react";

export default function ExpenseForm({ clients, onSubmit, loading }) {
  const [form, setForm] = useState({
    date: "",
    category: "",
    client_name: "",
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
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow rounded-lg p-6 mb-6"
    >
      <h2 className="text-xl font-bold mb-4">Agregar Gasto</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Fecha */}
        <div>
          <label className="block mb-1 font-medium">Fecha</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block mb-1 font-medium">Categoría</label>
          <input
            type="text"
            name="category"
            placeholder="Combustible, Herramientas, Reparaciones..."
            value={form.category}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* Cliente (solo referencia) */}
        <div>
          <label className="block mb-1 font-medium">Cliente</label>
          <input
            type="text"
            name="client_name"
            placeholder="Nombre del cliente..."
            value={form.client_name}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Monto */}
        <div>
          <label className="block mb-1 font-medium">Monto ($)</label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        {/* Método de pago */}
        <div>
          <label className="block mb-1 font-medium">Método de Pago</label>
          <input
            type="text"
            name="payment_method"
            placeholder="Efectivo, Transferencia, Tarjeta..."
            value={form.payment_method}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Proyecto (opcional) */}
        <div>
          <label className="block mb-1 font-medium">Proyecto (opcional)</label>
          <input
            type="text"
            name="project_id"
            value={form.project_id}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Cotización (opcional) */}
        <div>
          <label className="block mb-1 font-medium">Cotización (opcional)</label>
          <input
            type="text"
            name="quote_id"
            value={form.quote_id}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Descripción */}
        <div className="md:col-span-2">
          <label className="block mb-1 font-medium">Descripción</label>
          <textarea
            name="description"
            placeholder="Detalles del gasto..."
            value={form.description}
            onChange={handleChange}
            className="border p-2 rounded w-full h-24"
          />
        </div>

      </div>

      <div className="mt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Guardando..." : "Agregar Gasto"}
        </button>
      </div>
    </form>
  );
}