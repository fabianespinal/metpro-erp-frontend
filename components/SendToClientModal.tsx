"use client";

import { useState } from "react";
import { sendQuoteToClient, sendInvoiceToClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function SendToClientModal({
  open,
  onClose,
  id,
  type,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  id: number;
  type: "quote" | "invoice";
  onSent?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

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
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error al enviar. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Enviar {type === "quote" ? "Cotización" : "Factura"}
        </h2>

        <p className="text-gray-700 mb-6">
          ¿Desea enviar este documento al cliente? 
          Se adjuntará el PDF y se incluirá el enlace público.
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}