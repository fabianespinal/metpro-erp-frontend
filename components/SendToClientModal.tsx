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
  id: number | string;
  type: "quote" | "invoice";
  onSent?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  // Prevent undefined ID from causing 422 errors
  if (id === null || id === undefined || id === "" || id === 0) {
    console.error("SendToClientModal received invalid ID:", id);
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg shadow-card p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Invalid Document
          </h2>
          <p className="text-ink mb-6">
            This document cannot be sent because its ID is missing or invalid.
          </p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
      console.error("Send-to-client error:", err);

      const backendMessage =
        err?.message ||
        "Error al enviar. Intente nuevamente.";

      toast.error(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-card p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Enviar {type === "quote" ? "Cotización" : "Factura"}
        </h2>

        <p className="text-ink mb-6">
          ¿Desea enviar este documento al cliente?
          Se adjuntará el PDF y se incluirá el enlace público.
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button onClick={handleSend} disabled={loading}>
            {loading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}