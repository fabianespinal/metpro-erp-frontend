"use client";

import { useState } from "react";
import SendToClientModal from "@/components/SendToClientModal";

export default function SendToClientButton({
  id,
  type,
  onSent,
}: {
  id: number;
  type: "quote" | "invoice";
  onSent?: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
      >
        Enviar al Cliente
      </button>

      <SendToClientModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        id={id}
        type={type}
        onSent={() => {
          setModalOpen(false);
          if (onSent) onSent();
        }}
      />
    </>
  );
}
