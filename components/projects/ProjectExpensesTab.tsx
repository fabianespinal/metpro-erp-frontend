"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { es } from "@/lib/i18n/es";
import { getProyectoGastos, type ProjectLedger } from "@/lib/projectsApi";
import { money } from "@/lib/money";
import { dt } from "@/components/ui/data-table";
import { fb } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";

const t = es.led;

/** "Gastos del Proyecto": expense list, totals and categories for one project, with a date filter. */
export default function ProjectExpensesTab({ projectId }: { projectId: number | string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState<{ from: string; to: string }>({ from: "", to: "" });
  const [data, setData] = useState<ProjectLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getProyectoGastos(projectId, applied.from || undefined, applied.to || undefined));
    } catch (e) {
      setError(t.errorCargar + ((e as Error).message || ""));
    } finally {
      setLoading(false);
    }
  }, [projectId, applied]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = data?.totals;

  return (
    <section className="mb-6 space-y-4">
      <div className={`${fb.bar} items-end justify-between`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className={fb.label}>{t.desde}</label>
            <input type="date" className={`${fb.control} sm:w-44`} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={fb.label}>{t.hasta}</label>
            <input type="date" className={`${fb.control} sm:w-44`} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setApplied({ from, to })}>{t.aplicar}</Button>
            <Button
              variant="outline"
              onClick={() => {
                setFrom("");
                setTo("");
                setApplied({ from: "", to: "" });
              }}
            >
              {t.limpiar}
            </Button>
          </div>
        </div>
        <Link href="/expenses" className="text-sm text-accent underline">
          {t.agregarGasto}
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted">{es.comun.cargando}</p>
      ) : totals ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
              <div className="text-sm text-muted">{t.totalGastos}</div>
              <div className="text-2xl font-semibold tabular-nums text-ink">{money(totals.total_expenses)}</div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
              <div className="text-sm text-muted">{t.cantidadGastos}</div>
              <div className="text-2xl font-semibold tabular-nums text-ink">{totals.count}</div>
            </div>
          </div>

          {totals.expenses_by_category.length > 0 && (
            <div>
              <h3 className="mb-2 text-base font-semibold text-ink">{t.porCategoria}</h3>
              <div className={dt.wrap}>
                <table className={dt.table}>
                  <thead className={dt.thead}>
                    <tr>
                      <th className={dt.th}>{t.colCategoria}</th>
                      <th className={dt.thRight}>{t.colCantidad}</th>
                      <th className={dt.thRight}>{t.colMonto}</th>
                      <th className={dt.thRight}>{t.colPorcentaje}</th>
                    </tr>
                  </thead>
                  <tbody className={dt.tbody}>
                    {totals.expenses_by_category.map((c) => (
                      <tr key={c.category} className={dt.tr}>
                        <td className={dt.td}>{c.category}</td>
                        <td className={dt.tdRight}>{c.count}</td>
                        <td className={dt.tdRight}>{money(c.total)}</td>
                        <td className={dt.tdRight}>{c.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data && data.expenses.length > 0 ? (
            <div className={dt.wrap}>
              <table className={dt.table}>
                <thead className={dt.thead}>
                  <tr>
                    <th className={dt.th}>{t.colFecha}</th>
                    <th className={dt.th}>{t.colCategoria}</th>
                    <th className={dt.th}>{t.colDescripcion}</th>
                    <th className={dt.th}>{t.colMetodo}</th>
                    <th className={dt.thRight}>{t.colMonto}</th>
                  </tr>
                </thead>
                <tbody className={dt.tbody}>
                  {data.expenses.map((e) => (
                    <tr key={e.expense_id} className={dt.tr}>
                      <td className={dt.td}>{String(e.date).slice(0, 10)}</td>
                      <td className={dt.td}>{e.category}</td>
                      <td className={dt.td}>{e.description || es.comun.sinDatos}</td>
                      <td className={dt.td}>{e.payment_method || es.comun.sinDatos}</td>
                      <td className={dt.tdRight}>{money(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-line bg-canvas p-4 text-sm text-muted">{t.sinGastos}</p>
          )}
        </>
      ) : null}
    </section>
  );
}
