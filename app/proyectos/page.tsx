"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { es, ESTADOS_PROYECTO } from "@/lib/i18n/es";
import { createProyecto, listProyectos, type Proyecto } from "@/lib/projectsApi";
import StatusPill from "@/components/ui/StatusPill";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { dt } from "@/components/ui/data-table";
import { fb } from "@/components/ui/filter-bar";

const t = es.proyectos;
const inputClass =
  "h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent";

interface ClienteOpt {
  id: number;
  company_name: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [clientes, setClientes] = useState<ClienteOpt[]>([]);
  const [form, setForm] = useState({
    client_id: "",
    name: "",
    job_site_address: "",
    description: "",
    start_date: today(),
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listProyectos(status || undefined);
      setProyectos(Array.isArray(data) ? data : []);
    } catch (e) {
      setProyectos([]);
      setError(`${t.errorCargar}: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showForm || clientes.length) return;
    api
      .get("/clients/")
      .then((d) => setClientes(Array.isArray(d) ? (d as ClienteOpt[]) : []))
      .catch((e: Error) => toast.error(`${es.comun.cliente}: ${e.message}`));
  }, [showForm, clientes.length]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.client_id) return toast.error(t.clienteRequerido);
    if (!form.name.trim()) return toast.error(t.nombreRequerido);
    if (!form.start_date) return toast.error(t.inicioRequerido);
    setSaving(true);
    try {
      await createProyecto({
        client_id: Number(form.client_id),
        name: form.name.trim(),
        description: form.description.trim() || null,
        job_site_address: form.job_site_address.trim() || null,
        status: "pending",
        start_date: form.start_date,
      });
      toast.success(t.creado);
      setForm({ client_id: "", name: "", job_site_address: "", description: "", start_date: today() });
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(`${t.errorGuardar}: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title={t.titulo}
        subtitle={t.subtitulo}
        actions={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? es.comun.cancelar : t.nuevo}</Button>}
      />

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-card sm:grid-cols-2">
          <div>
            <label className={fb.label}>{es.comun.cliente} *</label>
            <select className={inputClass} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
              <option value="">—</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={fb.label}>{t.nombre} *</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className={fb.label}>{t.direccionObra}</label>
            <input className={inputClass} value={form.job_site_address} onChange={(e) => setForm({ ...form, job_site_address: e.target.value })} />
          </div>
          <div>
            <label className={fb.label}>{es.comun.fechaInicio} *</label>
            <input type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className={fb.label}>{t.descripcionCorta}</label>
            <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? es.comun.guardando : es.comun.guardar}
            </Button>
          </div>
        </form>
      )}

      <div className={fb.bar}>
        <div className="w-56">
          <label className={fb.label}>{es.comun.estado}</label>
          <select className={fb.control} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{es.comun.todos}</option>
            {ESTADOS_PROYECTO.map((s) => (
              <option key={s} value={s}>
                {es.estadosProyecto[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className={dt.wrap}>
        <table className={dt.table}>
          <thead className={dt.thead}>
            <tr>
              <th className={dt.th}>{t.numero}</th>
              <th className={dt.th}>{t.nombre}</th>
              <th className={dt.th}>{es.comun.cliente}</th>
              <th className={dt.th}>{t.cotizacion}</th>
              <th className={dt.th}>{t.factura}</th>
              <th className={dt.th}>{es.comun.estado}</th>
              <th className={dt.th}>{es.comun.fechaInicio}</th>
            </tr>
          </thead>
          <tbody className={dt.tbody}>
            {loading ? (
              <tr>
                <td colSpan={7} className={dt.empty}>
                  {es.comun.cargando}
                </td>
              </tr>
            ) : proyectos.length === 0 ? (
              <tr>
                <td colSpan={7} className={dt.empty}>
                  {t.vacio}
                </td>
              </tr>
            ) : (
              proyectos.map((p) => (
                <tr key={p.id} className={dt.tr}>
                  <td className={dt.td}>
                    <Link href={`/proyectos/${p.id}`} className="font-medium text-accent underline">
                      {p.project_number ?? `P-${p.id}`}
                    </Link>
                  </td>
                  <td className={dt.td}>{p.name}</td>
                  <td className={dt.td}>{p.client_name ?? es.comun.sinDatos}</td>
                  <td className={dt.td}>{p.quote_label ?? es.comun.sinDatos}</td>
                  <td className={dt.td}>{p.invoice_number ?? es.comun.sinDatos}</td>
                  <td className={dt.td}>
                    <StatusPill status={p.status} gender="m" />
                  </td>
                  <td className={dt.td}>{p.start_date?.slice(0, 10)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
