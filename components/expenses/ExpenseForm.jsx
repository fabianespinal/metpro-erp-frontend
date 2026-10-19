'use client';

import { useState } from "react";
import { es } from "@/lib/i18n/es";

export default function ExpenseForm({ clients, projects = [], onSubmit, loading }) {
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
      className="bg-surface shadow rounded-lg p-6 mb-6"
    >
      <h2 className="text-xl font-bold mb-4">Agregar Gasto</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Fecha */}
        <div>
          <label className="block mb-1 font-medium">Fecha</label>
          <input aria-label="Fecha"
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
          <input aria-label="Categoría"
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
          <input aria-label="Cliente"
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
          <input aria-label="Monto ($)"
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
          <input aria-label="Método de pago"
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
          <label className="block mb-1 font-medium">{es.led.proyectoOpcional}</label>
          <select aria-label={es.led.proyectoOpcional}
            name="project_id"
            value={form.project_id}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="">{es.led.sinProyecto}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_number ?? `P-${String(p.id).padStart(4, "0")}`} · {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cotización (opcional) */}
        <div>
          <label className="block mb-1 font-medium">Cotización (opcional)</label>
          <input aria-label="Cotización (opcional)"
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
          <textarea aria-label="Descripción"
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
          className="bg-accent text-white px-4 py-2 rounded hover:bg-accent-strong"
        >
          {loading ? "Guardando..." : "Agregar Gasto"}
        </button>
      </div>
    </form>
  );
}