"use client";

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
  const [form, setForm] = useState({
    amount: "",
    method: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await createPayment(invoiceId, {
        amount: Number(form.amount),
        method: form.method,
        notes: form.notes,
      });

      setLoading(false);
      onSuccess(); // refresh invoice
      onClose();   // close modal
    } catch (err) {
      console.error("Payment error:", err);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Record Payment</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Amount</label>
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
              name="method"
              value={form.method}
              onChange={handleChange}
              className="border p-2 rounded w-full"
              placeholder="Cash, Transfer, Card"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Notes (optional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="border p-2 rounded w-full"
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}