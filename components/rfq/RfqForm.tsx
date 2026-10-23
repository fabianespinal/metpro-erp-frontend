"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { es } from "@/lib/i18n/es";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import ErrorBanner from "@/components/ui/ErrorBanner";
import {
  createRfq, downloadRfqPdf, getRfq, getRfqOptions, setRfqStatus, updateRfq,
  type Rfq, type RfqItem, type RfqStatus,
} from "@/lib/rfqApi";

interface Supplier { id: number; company_name: string; is_active: boolean }
interface Product { id: number; name: string; description: string | null; unit_of_measure?: string | null }

const t = es.rfq;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : "");
const today = () => new Date().toISOString().slice(0, 10);

/** Create / edit an RFQ. Lines start from a product and every field stays editable. No prices anywhere. */
export default function RfqForm({ id }: { id?: number }) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<RfqStatus>("Draft");
  const [label, setLabel] = useState("");
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [billTo, setBillTo] = useState("");
  const [payment, setPayment] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<RfqItem[]>([]);
  const [query, setQuery] = useState("");
  const [printSeal, setPrintSeal] = useState(false);

  const locked = status !== "Draft";

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
          const r: Rfq = await getRfq(id);
          if (cancelled) return;
          setStatus(r.status);
          setLabel(r.label);
          setSupplierId(r.supplier_id);
          setTitle(r.title);
          setDate(r.rfq_date);
          setBillTo(r.bill_to ?? "");
          setPayment(r.payment_terms ?? "");
          setNotes(r.notes ?? "");
          setItems(r.items);
        } else {
          setTitle(opts.default_title);
          setBillTo(opts.default_bill_to);
        }
      } catch (e) {
        if (!cancelled) setLoadError(`${t.errorCargar} ${errMsg(e)}`);
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
    setItems([...items, { product_id: p.id, item: p.name, description: p.description ?? "", quantity: 1, unit: p.unit_of_measure ?? "" }]);
    setQuery("");
  };
  const patch = (i: number, k: keyof RfqItem, v: string | number) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));

  const save = async () => {
    if (supplierId === "") return toast.error(t.elegirSuplidor);
    if (items.length === 0) return toast.error(t.agregarArticulo);
    setSaving(true);
    try {
      const body = {
        supplier_id: Number(supplierId),
        title: title || null,
        rfq_date: date || null,
        bill_to: billTo || null,
        payment_terms: payment || null,
        notes: notes || null,
        items: items.map((it) => ({
          product_id: it.product_id,
          item: it.item,
          description: it.description || null,
          quantity: Number(it.quantity),
          unit: it.unit || null,
        })),
      };
      if (id) {
        const r = await updateRfq(id, body);
        setItems(r.items);
        toast.success(t.guardado);
      } else {
        const r = await createRfq(body);
        toast.success(t.creado);
        router.replace(`/compras/rfq/${r.id}` as Route);
      }
    } catch (e) {
      toast.error(t.errorGenerico + errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (next: "Draft" | "Sent") => {
    if (!id) return;
    try {
      const r = await setRfqStatus(id, next);
      setStatus(r.status);
      toast.success(next === "Sent" ? t.marcadaEnviada : t.vueltaBorrador);
    } catch (e) {
      toast.error(t.errorGenerico + errMsg(e));
    }
  };

  const pdf = async () => {
    if (!id) return;
    try {
      await downloadRfqPdf(id, label || `RFQ-${id}`, printSeal);
    } catch (e) {
      toast.error(t.errorPdf + errMsg(e));
    }
  };

  const input = "w-full rounded border p-2 disabled:bg-gray-50 disabled:opacity-70";
  return (
    <div className="w-full px-4 py-8 lg:px-8" data-testid="rfq-form">
      <PageHeader
        title={id ? `${label} · ${status === "Draft" ? t.borrador : status === "Sent" ? t.enviada : t.convertida}` : t.nuevo}
        actions={
          <>
            {id && (
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={printSeal} onChange={(e) => setPrintSeal(e.target.checked)} />
                {t.imprimirSello}
              </label>
            )}
            {id && <Button variant="outline" onClick={pdf}>{t.descargarPdf}</Button>}
            {id && status === "Draft" && <Button variant="outline" onClick={() => changeStatus("Sent")}>{t.marcarEnviada}</Button>}
            {id && status === "Sent" && <Button variant="outline" onClick={() => changeStatus("Draft")}>{t.volverBorrador}</Button>}
            <Button variant="outline" onClick={() => router.push("/compras" as Route)}>{t.volver}</Button>
          </>
        }
      />
      <ErrorBanner message={loadError} />
      {locked && <p className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{t.bloqueado}</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-surface p-6 shadow md:grid-cols-2">
        <label className="text-sm font-medium">{t.proveedor}
          <select aria-label={t.proveedor} value={supplierId} disabled={locked} onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : "")} className={input}>
            <option value="">{t.elegirSuplidor}</option>
            {suppliers.filter((s) => s.is_active || s.id === supplierId).map((s) => <option key={s.id} value={s.id}>{s.company_name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">{t.fecha}
          <input aria-label={t.fecha} type="date" value={date} disabled={locked} onChange={(e) => setDate(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium md:col-span-2">{t.titulo}
          <input aria-label={t.titulo} value={title} disabled={locked} onChange={(e) => setTitle(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium">{t.facturarA}
          <textarea aria-label={t.facturarA} rows={4} value={billTo} disabled={locked} onChange={(e) => setBillTo(e.target.value)} className={input} />
        </label>
        <label className="text-sm font-medium">{t.condicionesPago}
          <textarea aria-label={t.condicionesPago} rows={4} value={payment} disabled={locked} onChange={(e) => setPayment(e.target.value)} className={input} />
        </label>
      </div>

      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <h2 className="mb-3 text-lg font-semibold">{t.articulos}</h2>
        {!locked && (
          <div className="relative mb-4 max-w-md">
            <input aria-label={t.buscarProducto} placeholder={t.buscarProducto} value={query} onChange={(e) => setQuery(e.target.value)} className={input} />
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
          <p className="py-6 text-center text-muted">{t.sinArticulos}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted">
                  <th className="p-1">{t.articulo}</th><th className="p-1">{t.descripcion}</th>
                  <th className="p-1 w-28">{t.cantidad}</th><th className="p-1 w-28">{t.unidad}</th><th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="align-top">
                    <td className="p-1"><input aria-label={`${t.articulo} ${i + 1}`} value={it.item} disabled={locked} onChange={(e) => patch(i, "item", e.target.value)} className={input} /></td>
                    <td className="p-1"><textarea aria-label={`${t.descripcion} ${i + 1}`} rows={2} value={it.description ?? ""} disabled={locked} onChange={(e) => patch(i, "description", e.target.value)} className={input} /></td>
                    <td className="p-1"><input aria-label={`${t.cantidad} ${i + 1}`} type="number" min="0" step="any" value={it.quantity} disabled={locked} onChange={(e) => patch(i, "quantity", e.target.value === "" ? 0 : Number(e.target.value))} className={input} /></td>
                    <td className="p-1"><input aria-label={`${t.unidad} ${i + 1}`} value={it.unit ?? ""} disabled={locked} onChange={(e) => patch(i, "unit", e.target.value)} className={input} /></td>
                    <td className="p-1">{!locked && <button type="button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="px-2 py-1 text-red-600 hover:bg-red-50">{t.quitar}</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-lg bg-surface p-6 shadow">
        <label className="text-sm font-medium">{t.notas}
          <textarea aria-label={t.notas} rows={3} value={notes} disabled={locked} onChange={(e) => setNotes(e.target.value)} className={input} />
        </label>
        <p className="mt-3 text-xs text-muted">{t.firmaNota}</p>
      </div>

      {!locked && <Button onClick={save} disabled={saving}>{saving ? t.guardando : id ? t.guardar : t.crear}</Button>}
    </div>
  );
}
