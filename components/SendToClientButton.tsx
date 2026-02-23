"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
      <Button onClick={() => setModalOpen(true)}>
        Enviar al Cliente
      </Button>

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