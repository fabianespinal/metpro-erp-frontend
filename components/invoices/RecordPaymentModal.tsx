"use client";

import { es } from "@/lib/i18n/es";
import { useState } from "react";
import { createPayment } from "@/lib/invoiceApi";

interface Props {
  invoiceId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordPaymentModal({
  invoiceId,
  open,
  onClose,
  onSuccess,
}: Props) {
  const today = new Date().toISOString().split("T")[0];

const [form, setForm] = useState({
  amount: "",
  method: "",
  notes: "",
  payment_date: today,  // ← added
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("El monto debe ser mayor que cero.");
      return;
    }
    setLoading(true);

    try {
      await createPayment(invoiceId, {
        amount,
        method: form.method,
        notes: form.notes,
        payment_date: form.payment_date,  // ← added
      });

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err) {
      // Show the backend reason (e.g. overpayment, closed invoice). The payment was NOT recorded.
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "No se pudo registrar el pago.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface p-6 rounded shadow-card w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">{es.fact.registrarPago}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">{es.fact.monto}</label>
            <input
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              className="border p-2 rounded w-full"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">{es.fact.metodoPago}</label>
            <input
              type="text"
              name="method"
              value={form.method}
              onChange={handleChange}
              className="border p-2 rounded w-full"
              placeholder="Efectivo, Transferencia, Tarjeta"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">{es.fact.fechaPago}</label>
            <input
              type="date"
              name="payment_date"
              value={form.payment_date}
              onChange={handleChange}
              className="border p-2 rounded w-full"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">{es.fact.notasOpcional}</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>

          {error && (
            <p role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              {es.fact.cancelar}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-accent text-white px-4 py-2 rounded hover:bg-accent-strong"
            >
              {loading ? es.cot.guardando : es.fact.registrarPago}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
