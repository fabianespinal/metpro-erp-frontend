"use client";

import { useState } from "react";
import { sendQuoteToClient, sendInvoiceToClient } from "@/lib/api";
import toast from "react-hot-toast";

export default function SendToClientButton({
  id,
  type,
  onSent,
}: {
  id: number;
  type: "quote" | "invoice";
  onSent?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);

    try {
      if (type === "quote") {
        await sendQuoteToClient(id);
      } else {
        await sendInvoiceToClient(id);
      }

      toast.success("Enviado al cliente exitosamente.");

      if (onSent) onSent();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error al enviar. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className={`px-4 py-2 rounded text-white ${
        loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {loading ? "Enviando..." : "Enviar al Cliente"}
    </button>
  );
}