"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { es } from "@/lib/i18n/es";
import { businessToday } from "@/lib/dates";
import { useCurrentRole } from "@/lib/currentRole";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { getRfqOptions } from "@/lib/rfqApi";
import {
  createPo, deletePo, downloadPoPdf, getPo, lineAmount, setPoStatus, updatePo,
  type Po, type PoItem, type PoStatus,
} from "@/lib/poApi";

interface Supplier { id: number; company_name: string; is_active: boolean }
interface Product { id: number; name: string; description: string | null; unit_of_measure?: string | null }

const t = es.po;
const r = es.rfq;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "");
const money = (v: number) => `RD$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Create / edit a purchase order. Lines start from a product; names, quantities and prices are typed by hand. */
export default function PoForm({ id }: { id?: number }) {
  const router = useRouter();
  const { isAdmin } = useCurrentRole();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<PoStatus>("Draft");
  const [label, setLabel] = useState("");
  const [rfqLabel, setRfqLabel] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(businessToday());
  const [billTo, setBillTo] = useState("");
  const [payment, setPayment] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PoItem[]>([]);
  const [query, setQuery] = useState("");
  const [printSeal, setPrintSeal] = useState(false);

  const locked = status !== "Draft";
  const subtotal = useMemo(() => items.reduce((s, it) => s + lineAmount(it.quantity, it.unit_price), 0), [items]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [opts, sup, prod] = await Promise.all([
          getRfqOptions(),
          api.get("/suppliers").catch(() => []),
          api.get("/products").catch(() => []),
        ]);
        if (cancelled) return;
        setSuppliers(Array.isArray(sup) ? (sup as Supplier[]) : []);
        setProducts(Array.isArray(prod) ? (prod as Product[]) : []);
        if (id) {
          const p: Po = await getPo(id);
          if (cancelled) return;
          setStatus(p.status);
          setLabel(p.label);
          setRfqLabel(p.rfq_label);
          setSupplierId(p.supplier_id);
          setTitle(p.title);
          setDate(p.po_date);
          setBillTo(p.bill_to ?? "");
          setPayment(p.payment_terms ?? "");
          setNotes(p.notes ?? "");
          setItems(p.items);
        } else {
          setBillTo(opts.default_bill_to);
        }
      } catch (e) {
        if (!cancelled) setLoadError(`${r.errorCargar} ${errMsg(e)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [products, query]);

  const addProduct = (p: Product) => {
    setItems([...items, { product_id: p.id, item: p.name, description: p.description ?? "", quantity: 1, unit: p.unit_of_measure ?? "", unit_price: 0 }]);
    setQuery("");
  };
  const patch = (i: number, k: keyof PoItem, v: string | number) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));

  const save = async () => {
    if (supplierId === "") return toast.error(r.elegirSuplidor);
    if (items.length === 0) return toast.error(r.agregarArticulo);
    setSaving(true);
    try {
      const body = {
        supplier_id: Number(supplierId),
        title: title || null,
        po_date: date || null,
        bill_to: billTo || null,
        payment_terms: payment || null,
        notes: notes || null,
        items: items.map((it) => ({
          product_id: it.product_id,
          item: it.item,
          description: it.description || null,
          quantity: Number(it.quantity),
          unit: it.unit || null,
          unit_price: Number(it.unit_price) || 0,
        })),
      };
      if (id) {
        const p = await updatePo(id, body);
        setItems(p.items);
        toast.success(t.guardado);
      } else {
        const p = await createPo(body);
        toast.success(t.creado);
        router.replace(`/compras/po/${p.id}` as Route);
      }
    } catch (e) {
      toast.error(r.errorGenerico + errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (next: "Issued" | "Cancelled") => {
    if (!id) return;
    if (!confirm(next === "Issued" ? t.confirmarEmitir : t.confirmarCancelar)) return;
    if (next === "Issued" && items.some((it) => !(Number(it.unit_price) > 0))) return toast.error(t.precioFalta);
    try {
      const p = await setPoStatus(id, next);
      setStatus(p.status);
      toast.success(next === "Issued" ? t.emitidaOk : t.canceladaOk);
    } catch (e) {
      toast.error(r.errorGenerico + errMsg(e));
    }
  };

  const remove = async () => {
    if (!id || !confirm(t.confirmarEliminar)) return;
    try {
      await deletePo(id);
      toast.success(t.eliminado);
      router.push("/compras" as Route);
    } catch (e) {
      toast.error(r.errorGenerico + errMsg(e));
    }
  };

  const pdf = async () => {
    if (!id) return;
    try {
      await downloadPoPdf(id, label || `PO-${id}`, printSeal);
    } catch (e) {
      toast.error(r.errorPdf + errMsg(e));
    }
  };

  if (!isAdmin) return <p className="p-6 text-sm text-muted">{r.noDisponible}</p>;

  const statusText = status === "Draft" ? t.borrador : status === "Issued" ? t.emitida : t.cancelada;
  const input = "w-full rounded border p-2 disabled:bg-gray-50 disabled:opacity-70";
  return (
    <div className="w-full px-4 py-8 lg:px-8" data-testid="po-form">
      <PageHeader
        title={id ? `${label} · ${statusText}` : t.nuevo}
        actions={
          <>
            {id && (
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={printSeal} onChange={(e) => setPrintSeal(e.target.checked)} />
                {r.imprimirSello}
              </label>
            )}
            {id && <Button variant="outline" onClick={pdf}>{r.descargarPdf}</Button>}
            {id && status === "Draft" && <Button variant="outline" onClick={() => changeStatus("Issued")}>{t.emitir}</Button>}
            {id && status === "Issued" && <Button variant="outline" onClick={() => changeStatus("Cancelled")}>{t.cancelar}</Button>}
            {id && status === "Draft" && <Button variant="outline" onClick={remove}>{r.eliminar}</Button>}
            <Button variant="outline" onClick={() => router.push("/compras" as Route)}>{r.volver}</Button>
          </>
        }
      />
      <ErrorBanner message={loadError} />
      {rfqLabel && <p className="mb-2 text-sm text-muted">{t.desdeRfq} {rfqLabel}</p>}
      {locked && <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{t.bloqueado}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-surface p-6 shadow md:grid-cols-2">
        <label className="text-sm font-medium">{r.proveedor}
          <select aria-label={r.proveedor} value={supplierId} disabled={locked} onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : "")} className={input}>
            <option value="">{r.elegirSuplidor}</option>
            {suppliers.filter((s) => s.is_active || s.id === supplierId).map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">{r.fecha}
          <input aria-label={r.fecha} type="date" value={date} disabled={locked} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium md:col-span-2">{r.titulo}
          <input aria-label={r.titulo} value={title} disabled={locked} placeholder="Orden de compra" onChange={(e) => setTitle(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium">{r.facturarA}
          <textarea aria-label={r.facturarA} rows={4} value={billTo} disabled={locked} onChange={(e) => setBillTo(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium">{r.condicionesPago}
          <textarea aria-label={r.condicionesPago} rows={4} value={payment} disabled={locked} onChange={(e) => setPayment(e.target.value)} className={input} />
        </label>
      </div>

      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-3 text-lg font-semibold">{r.articulos}</h2>
        {!locked && (
          <div className="relative mb-4 max-w-md">
            <input aria-label={r.buscarProducto} placeholder={r.buscarProducto} value={query} onChange={(e) => setQuery(e.target.value)} className={input} />
            {matches.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded border bg-surface shadow" data-testid="product-matches">
                {matches.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => addProduct(p)} className="w-full px-3 py-2 text-left text-sm hover:bg-accent/10">{p.name}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {items.length === 0 ? (
          <p className="py-6 text-center text-muted">{r.sinArticulos}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted">
                  <th className="p-1">{r.articulo}</th><th className="p-1">{r.descripcion}</th>
                  <th className="p-1 w-24">{r.cantidad}</th><th className="p-1 w-24">{r.unidad}</th>
                  <th className="p-1 w-32">{t.precio}</th><th className="p-1 w-32 text-right">{t.monto}</th><th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="align-top">
                    <td className="p-1"><input aria-label={`${r.articulo} ${i + 1}`} value={it.item} disabled={locked} onChange={(e) => patch(i, "item", e.target.value)} className={input} /></td>
                    <td className="p-1"><textarea aria-label={`${r.descripcion} ${i + 1}`} rows={2} value={it.description ?? ""} disabled={locked} onChange={(e) => patch(i, "description", e.target.value)} className={input} /></td>
                    <td className="p-1"><input aria-label={`${r.cantidad} ${i + 1}`} type="number" min="0" step="any" value={it.quantity} disabled={locked} onChange={(e) => patch(i, "quantity", e.target.value === "" ? 0 : Number(e.target.value))} className={input} /></td>
                    <td className="p-1"><input aria-label={`${r.unidad} ${i + 1}`} value={it.unit ?? ""} disabled={locked} onChange={(e) => patch(i, "unit", e.target.value)} className={input} /></td>
                    <td className="p-1"><input aria-label={`${t.precio} ${i + 1}`} type="number" min="0" step="any" value={it.unit_price} disabled={locked} onChange={(e) => patch(i, "unit_price", e.target.value === "" ? 0 : Number(e.target.value))} className={input} /></td>
                    <td className="p-1 pt-3 text-right" data-testid={`amount-${i}`}>{money(lineAmount(it.quantity, it.unit_price))}</td>
                    <td className="p-1">{!locked && <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="px-2 py-1 text-red-600 hover:bg-red-50">{r.quitar}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 ml-auto w-64 space-y-1 text-sm">
              <div className="flex justify-between"><span>{t.subtotal}</span><span data-testid="po-subtotal">{money(subtotal)}</span></div>
              <div className="flex justify-between font-bold"><span>{t.total}</span><span data-testid="po-total">{money(subtotal)}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <label className="text-sm font-medium">{r.notas}
          <textarea aria-label={r.notas} rows={3} value={notes} disabled={locked} onChange={(e) => setNotes(e.target.value)} className={input} />
        </label>
        <p className="mt-3 text-xs text-muted">{t.firmaNota}</p>
      </div>

      {!locked && <Button onClick={save} disabled={saving}>{saving ? r.guardando : id ? r.guardar : t.crear}</Button>}
    </div>
  );
}
