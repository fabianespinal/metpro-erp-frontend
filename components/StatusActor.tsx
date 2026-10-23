"use client";

import { useState } from "react";
import { es } from "@/lib/i18n/es";
import { lastChangeText, type HistoryKind } from "@/lib/statusHistory";
import StatusHistoryModal from "@/components/StatusHistoryModal";

interface Props {
  kind: HistoryKind;
  id: string | number;
  createdBy?: string | null;
  lastBy?: string | null;
  lastAt?: string | null;
}

/**
 * Line under the status pill. With history: "por Ana · 23/10/2026 12:05" and a click opens the full history.
 * Without it (switch off, or a record from before the switch): the old "Creado por <name>" text, unchanged.
 */
export default function StatusActor({ kind, id, createdBy, lastBy, lastAt }: Props) {
  const [open, setOpen] = useState(false);
  const text = lastChangeText(lastBy, lastAt);
  if (!text) {
    return <div className="text-xs text-muted mt-1">{es.cot.creadoPor} {createdBy || "—"}</div>;
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={es.historial.verHistorial}
        className="text-xs text-accent mt-1 underline decoration-dotted text-left"
      >
        {text}
      </button>
      {open && <StatusHistoryModal kind={kind} id={id} onClose={() => setOpen(false)} />}
    </>
  );
}
