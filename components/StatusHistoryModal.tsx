"use client";

import { useEffect, useState } from "react";
import { es } from "@/lib/i18n/es";
import { fmtDateTime } from "@/lib/dates";
import { getStatusLabel } from "@/lib/i18n/statusLabel";
import { fetchStatusHistory, type HistoryKind, type StatusHistory } from "@/lib/statusHistory";

interface Props {
  kind: HistoryKind;
  id: string | number;
  onClose: () => void;
}

type State = { phase: "loading" } | { phase: "error" } | { phase: "ready"; data: StatusHistory };

export default function StatusHistoryModal({ kind, id, onClose }: Props) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let alive = true;
    fetchStatusHistory(kind, id)
      .then((data) => alive && setState({ phase: "ready", data }))
      .catch(() => alive && setState({ phase: "error" }));
    return () => {
      alive = false;
    };
  }, [kind, id]);

  const entries = state.phase === "ready" ? state.data.entries : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-lg shadow-card max-w-lg w-full p-6">
        <h3 className="text-xl font-bold text-ink mb-4">{es.historial.titulo}</h3>
        {state.phase === "loading" && <p className="text-muted">{es.historial.cargando}</p>}
        {state.phase === "error" && <p className="text-red-600">{es.historial.error}</p>}
        {state.phase === "ready" && entries.length === 0 && <p className="text-muted">{es.historial.vacio}</p>}
        {entries.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1 pr-3">{es.historial.colFecha}</th>
                <th className="py-1 pr-3">{es.historial.colCambio}</th>
                <th className="py-1">{es.historial.colUsuario}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-t border-line align-top">
                  <td className="py-1 pr-3 whitespace-nowrap">{fmtDateTime(e.changed_at)}</td>
                  <td className="py-1 pr-3">
                    {e.from_status
                      ? `${getStatusLabel(e.from_status, "f")} → ${getStatusLabel(e.to_status, "f")}`
                      : `${es.historial.creada}: ${getStatusLabel(e.to_status, "f")}`}
                  </td>
                  <td className="py-1">{e.actor_name || es.historial.sistema}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 border border-line rounded-lg hover:bg-canvas">
            {es.historial.cerrar}
          </button>
        </div>
      </div>
    </div>
  );
}
