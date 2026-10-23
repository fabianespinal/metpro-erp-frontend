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
import { useCurrentRole } from "@/lib/currentRole";
import { deletePo, downloadPoPdf, getPoEnabled, listPos, type Po } from "@/lib/poApi";
import { deleteRfq, downloadRfqPdf, getRfqOptions, listRfqs, type Rfq } from "@/lib/rfqApi";

const t = es.rfq;
const STATUS: Record<string, string> = { Draft: t.borrador, Sent: t.enviada, Converted: t.convertida };
const tp = es.po;
const PO_STATUS: Record<string, string> = { Draft: tp.borrador, Issued: tp.emitida, Cancelled: tp.cancelada };
const money = (v: number) => `RD$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "");

export default function ComprasPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Rfq[]>([]);
  const { isAdmin } = useCurrentRole();
  const [poOn, setPoOn] = useState(false);
  const [poRows, setPoRows] = useState<Po[]>([]);
  const [tab, setTab] = useState<"rfq" | "po">("rfq");
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
        if (isAdmin && (await getPoEnabled())) {
          const pos = await listPos();
          if (cancelled) return;
          setPoOn(true);
          setPoRows(pos);
        } else {
          setPoOn(false);
        }
        setError(null);
      } catch (e) {
        if (!cancelled) setError(`${t.errorCargar} ${errMsg(e)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick, isAdmin]);

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

  const removePo = async (p: Po) => {
    if (!confirm(tp.confirmarEliminar)) return;
    try {
      await deletePo(p.id);
      toast.success(tp.eliminado);
      reload();
    } catch (e) {
      toast.error(t.errorGenerico + errMsg(e));
    }
  };

  const showPo = poOn && tab === "po";

  if (enabled === false) return <p className="p-6 text-sm text-muted">{t.noDisponible}</p>;

  return (
    <div className="w-full px-4 py-8 lg:px-8">
      <PageHeader
        title={t.tituloPagina}
        actions={
          <Link href={(showPo ? "/compras/po/new" : "/compras/rfq/new") as Route}>
            <Button>{showPo ? tp.nuevo : t.nuevo}</Button>
          </Link>
        }
      />
      <div className="mb-4 flex gap-2 border-b" role="tablist">
        <button role="tab" aria-selected={!showPo} onClick={() => setTab("rfq")} className={`px-3 py-2 text-sm font-medium ${!showPo ? "border-b-2 border-accent" : "text-muted"}`}>RFQ</button>
        {poOn && <button role="tab" aria-selected={showPo} onClick={() => setTab("po")} className={`px-3 py-2 text-sm font-medium ${showPo ? "border-b-2 border-accent" : "text-muted"}`}>{tp.pestana}</button>}
      </div>
      <ErrorBanner message={error} onRetry={reload} />
      {showPo ? (
      <div className="overflow-x-auto rounded-lg bg-surface shadow" data-testid="po-list">
        <div className="border-b p-4 font-bold">{tp.lista} ({poRows.length})</div>
        {poRows.length === 0 ? (
          <div className="p-8 text-center text-muted">{tp.vacio}</div>
        ) : (
          <table className={dt.table}>
            <thead className={dt.thead}>
              <tr>
                <th className={dt.th}>{t.numero}</th><th className={dt.th}>{t.fecha}</th><th className={dt.th}>{t.proveedor}</th>
                <th className={dt.th}>{t.articulos}</th><th className={dt.thRight}>{tp.total}</th><th className={dt.th}>{t.estado}</th><th className={dt.thRight}>{t.acciones}</th>
              </tr>
            </thead>
            <tbody className={dt.tbody}>
              {poRows.map((p) => (
                <tr key={p.id} className={dt.tr}>
                  <td className={dt.td}>{p.label}</td>
                  <td className={dt.td}>{p.po_date}</td>
                  <td className={dt.td}>{p.vendor_name}</td>
                  <td className={dt.td}>{p.item_count}</td>
                  <td className={dt.tdRight}>{money(p.total)}</td>
                  <td className={dt.td}>{PO_STATUS[p.status] ?? p.status}</td>
                  <td className={dt.tdRight}>
                    <div className="flex justify-end gap-2">
                      <Link href={`/compras/po/${p.id}` as Route} className="rounded px-2 py-1 text-accent hover:bg-accent/10">{p.status === "Draft" ? t.editar : t.ver}</Link>
                      <button onClick={() => downloadPoPdf(p.id, p.label).catch((e) => toast.error(t.errorPdf + errMsg(e)))} className="rounded px-2 py-1 text-accent hover:bg-accent/10">PDF</button>
                      {p.status === "Draft" && <button onClick={() => removePo(p)} className="rounded px-2 py-1 text-red-600 hover:bg-red-50">{t.eliminar}</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      ) : (
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
      )}
    </div>
  );
}
