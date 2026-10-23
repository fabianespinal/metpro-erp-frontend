"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import toast from "react-hot-toast";
import { es } from "@/lib/i18n/es";
import { dt } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { deleteRfq, downloadRfqPdf, getRfqOptions, listRfqs, type Rfq } from "@/lib/rfqApi";

const t = es.rfq;
const STATUS: Record<string, string> = { Draft: t.borrador, Sent: t.enviada, Converted: t.convertida };
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "");

export default function ComprasPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Rfq[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  const reload = () => setTick((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const opts = await getRfqOptions();
        if (cancelled) return;
        setEnabled(opts.rfq_enabled);
        if (!opts.rfq_enabled) return;
        const data = await listRfqs();
        if (cancelled) return;
        setRows(data);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(`${t.errorCargar} ${errMsg(e)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const remove = async (r: Rfq) => {
    if (!confirm(t.confirmarEliminar)) return;
    try {
      await deleteRfq(r.id);
      toast.success(t.eliminado);
      reload();
    } catch (e) {
      toast.error(t.errorGenerico + errMsg(e));
    }
  };

  if (enabled === false) return <p className="p-6 text-sm text-muted">{t.noDisponible}</p>;

  return (
    <div className="w-full px-4 py-8 lg:px-8">
      <PageHeader
        title={t.tituloPagina}
        actions={
          <Link href={"/compras/rfq/new" as Route}>
            <Button>{t.nuevo}</Button>
          </Link>
        }
      />
      <div className="mb-4 flex gap-2 border-b" role="tablist">
        <span role="tab" aria-selected="true" className="border-b-2 border-accent px-3 py-2 text-sm font-medium">RFQ</span>
      </div>
      <ErrorBanner message={error} onRetry={reload} />
      <div className="overflow-x-auto rounded-lg bg-surface shadow">
        <div className="border-b p-4 font-bold">{t.lista} ({rows.length})</div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-muted">{t.vacio}</div>
        ) : (
          <table className={dt.table}>
            <thead className={dt.thead}>
              <tr>
                <th className={dt.th}>{t.numero}</th><th className={dt.th}>{t.fecha}</th><th className={dt.th}>{t.proveedor}</th>
                <th className={dt.th}>{t.articulos}</th><th className={dt.th}>{t.estado}</th><th className={dt.thRight}>{t.acciones}</th>
              </tr>
            </thead>
            <tbody className={dt.tbody}>
              {rows.map((r) => (
                <tr key={r.id} className={dt.tr}>
                  <td className={dt.td}>{r.label}</td>
                  <td className={dt.td}>{r.rfq_date}</td>
                  <td className={dt.td}>{r.vendor_name}</td>
                  <td className={dt.td}>{r.item_count}</td>
                  <td className={dt.td}>{STATUS[r.status] ?? r.status}</td>
                  <td className={dt.tdRight}>
                    <div className="flex justify-end gap-2">
                      <Link href={`/compras/rfq/${r.id}` as Route} className="rounded px-2 py-1 text-accent hover:bg-accent/10">{r.status === "Draft" ? t.editar : t.ver}</Link>
                      <button onClick={() => downloadRfqPdf(r.id, r.label).catch((e) => toast.error(t.errorPdf + errMsg(e)))} className="rounded px-2 py-1 text-accent hover:bg-accent/10">PDF</button>
                      {r.status === "Draft" && <button onClick={() => remove(r)} className="rounded px-2 py-1 text-red-600 hover:bg-red-50">{t.eliminar}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
