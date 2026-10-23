"use client";

import { useMemo, useState } from "react";
import { es } from "@/lib/i18n/es";
import { Button } from "@/components/ui/button";
import { compareParity } from "@/lib/estimatorCalc";
import type { EstimatePreview } from "@/lib/estimatorApi";
import { takeOffInputClass } from "@/components/quotes/takeoff/LineCard";

/** Admin check against the workbook. Typed values live in this component's state only. Never sent or stored. */
export function ParityPanel({ preview }: { preview: EstimatePreview }) {
  const [entries, setEntries] = useState<Array<{ cell: string; value: string }>>([{ cell: "", value: "" }]);
  const typed = useMemo(() => {
    const out: Record<string, string> = {};
    for (const e of entries) if (e.cell.trim()) out[e.cell] = e.value;
    return out;
  }, [entries]);
  const { rows, unknown } = useMemo(() => compareParity(preview, typed), [preview, typed]);

  function update(i: number, patch: Partial<{ cell: string; value: string }>) {
    setEntries((prev) => prev.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-4 shadow-card" aria-label={es.est.paridad}>
      <h2 className="mb-1 text-sm font-semibold text-ink">{es.est.paridad}</h2>
      <p className="mb-3 text-xs text-muted">{es.est.paridadAyuda}</p>
      <div className="space-y-2">
        {entries.map((e, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input
              className={takeOffInputClass}
              placeholder={es.est.celda}
              aria-label={es.est.celda}
              value={e.cell}
              onChange={(ev) => update(i, { cell: ev.target.value })}
            />
            <input
              className={takeOffInputClass}
              placeholder={es.est.valorLibro}
              aria-label={es.est.valorLibro}
              inputMode="decimal"
              value={e.value}
              onChange={(ev) => update(i, { value: ev.target.value })}
            />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" className="mt-2" onClick={() => setEntries((p) => [...p, { cell: "", value: "" }])}>
        {es.est.agregarFila}
      </Button>
      {unknown.map((c) => (
        <p key={c} className="mt-2 text-sm text-red-600">{es.est.celdaDesconocida(c)}</p>
      ))}
      {rows.length > 0 ? (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th>{es.est.celda}</th><th>{es.est.valorEstimador}</th><th>{es.est.valorLibro}</th><th>{es.est.diferencia}</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cell} data-testid={`parity-${r.cell}`}>
                <td>{r.cell}</td>
                <td>{r.estimator}</td>
                <td>{r.workbook}</td>
                <td>{r.difference}</td>
                <td className={r.matches ? "text-ink" : "font-semibold text-red-600"}>
                  {r.matches ? es.est.coincide : es.est.noCoincide}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
