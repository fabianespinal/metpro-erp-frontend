"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { es, ESTADOS_PROYECTO } from "@/lib/i18n/es";
import { deleteProyecto, getProyecto, updateProyecto, type Proyecto } from "@/lib/projectsApi";
import StatusPill from "@/components/ui/StatusPill";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { fb } from "@/components/ui/filter-bar";
import { useCurrentRole } from "@/lib/currentRole";
import FullCopyButton from "@/components/FullCopyButton";
import ProjectExpensesTab from "@/components/projects/ProjectExpensesTab";
import ProjectCostTab from "@/components/projects/ProjectCostTab";

const t = es.proyectos;
const inputClass =
  "h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent";
const areaClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent";

interface FormState {
  name: string;
  status: string;
  job_site_address: string;
  description: string;
  start_date: string;
  end_date: string;
  estimated_budget: string;
  notes: string;
}

function toForm(p: Proyecto): FormState {
  return {
    name: p.name ?? "",
    status: p.status,
    job_site_address: p.job_site_address ?? "",
    description: p.description ?? "",
    start_date: p.start_date?.slice(0, 10) ?? "",
    end_date: p.end_date?.slice(0, 10) ?? "",
    estimated_budget: p.estimated_budget === null || p.estimated_budget === undefined ? "" : String(p.estimated_budget),
    notes: p.notes ?? "",
  };
}

export default function ProyectoDetallePage() {
  const { isAdmin } = useCurrentRole();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"datos" | "gastos" | "costos">("datos");

  const load = useCallback(async () => {
    try {
      const p = await getProyecto(id);
      setProyecto(p);
      setForm(toForm(p));
    } catch (e) {
      setError((e as Error).message || t.noEncontrado);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) return toast.error(t.nombreRequerido);
    if (!form.start_date) return toast.error(t.inicioRequerido);
    if (form.end_date && form.end_date < form.start_date) return toast.error(t.fechaFinInvalida);
    setSaving(true);
    try {
      const budget = form.estimated_budget.trim() === "" ? null : Number(form.estimated_budget);
      const updated = await updateProyecto(id, {
        name: form.name.trim(),
        status: form.status,
        job_site_address: form.job_site_address,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date || null,
        estimated_budget: budget !== null && Number.isFinite(budget) ? budget : null,
        notes: form.notes,
      });
      setProyecto(updated);
      setForm(toForm(updated));
      toast.success(t.guardado);
    } catch (err) {
      toast.error(`${t.errorGuardar}: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t.confirmarEliminar)) return;
    try {
      await deleteProyecto(id);
      toast.success(t.eliminado);
      router.push("/proyectos");
    } catch (err) {
      toast.error(`${t.errorEliminar}: ${(err as Error).message}`);
    }
  }

  if (loading) return <p className="p-6 text-sm text-muted">{es.comun.cargando}</p>;

  if (error || !proyecto || !form) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error || t.noEncontrado}
        </p>
        <Link href="/proyectos" className="mt-4 inline-block text-sm text-accent underline">
          {es.comun.volver}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={`${proyecto.project_number ?? `P-${proyecto.id}`} · ${proyecto.name}`}
        subtitle={proyecto.client_name ?? undefined}
        actions={
          <>
            <StatusPill status={proyecto.status} gender="m" />
            <Button variant="outline" asChild>
              <Link href="/proyectos">{es.comun.volver}</Link>
            </Button>
          </>
        }
      />

      <div role="tablist" className="mb-4 flex gap-1 border-b border-line">
        {([
          ["datos", es.led.tabDatos],
          ["gastos", es.led.tabGastos],
          ["costos", es.cst.tabCostos],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === key ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "gastos" && <ProjectExpensesTab projectId={proyecto.id} />}

      {tab === "costos" && <ProjectCostTab projectId={proyecto.id} />}

      {tab === "datos" && (
      <>
      <section className="mb-6 rounded-lg border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-3 text-base font-semibold text-ink">{t.vinculos}</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">{es.comun.cliente}</dt>
            <dd className="font-medium">{proyecto.client_name ?? es.comun.sinDatos}</dd>
          </div>
          <div>
            <dt className="text-muted">{t.cotizacion}</dt>
            <dd className="font-medium">
              {proyecto.quote_id ? (
                <span className="inline-flex flex-wrap items-center gap-3">
                  <Link href={`/quotes/${proyecto.quote_id}/view`} className="text-accent underline">
                    {proyecto.quote_label ?? proyecto.quote_id}
                  </Link>
                  <FullCopyButton kind="quote" id={proyecto.quote_id} />
                </span>
              ) : (
                t.sinCotizacion
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t.factura}</dt>
            <dd className="font-medium">
              {proyecto.invoice_id ? (
                <span className="inline-flex flex-wrap items-center gap-3">
                  <Link href={`/invoices/${proyecto.invoice_id}`} className="text-accent underline">
                    {proyecto.invoice_number ?? proyecto.invoice_id}
                  </Link>
                  <FullCopyButton kind="invoice" id={proyecto.invoice_id} />
                </span>
              ) : (
                t.sinFactura
              )}
            </dd>
          </div>
        </dl>
      </section>

      <form onSubmit={handleSave} className="mb-6 grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-card sm:grid-cols-2">
        <div>
          <label className={fb.label}>{t.nombre} *</label>
          <input aria-label={t.nombre} className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className={fb.label}>{es.comun.estado}</label>
          <select aria-label={es.comun.estado} className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {ESTADOS_PROYECTO.map((s) => (
              <option key={s} value={s}>
                {es.estadosProyecto[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={fb.label}>{t.direccionObra}</label>
          <input aria-label={t.direccionObra} className={inputClass} value={form.job_site_address} onChange={(e) => setForm({ ...form, job_site_address: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={fb.label}>{t.descripcionCorta}</label>
          <input aria-label={t.descripcionCorta} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className={fb.label}>{es.comun.fechaInicio} *</label>
          <input aria-label={es.comun.fechaInicio} type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        <div>
          <label className={fb.label}>{es.comun.fechaFin}</label>
          <input aria-label={es.comun.fechaFin} type="date" className={inputClass} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
        <div>
          <label className={fb.label}>{t.presupuesto}</label>
          <input aria-label={t.presupuesto} type="number" min="0" step="0.01" className={inputClass} value={form.estimated_budget} onChange={(e) => setForm({ ...form, estimated_budget: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className={fb.label}>{es.comun.notas}</label>
          <textarea aria-label={es.comun.notas} rows={3} className={areaClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? es.comun.guardando : es.comun.guardar}
          </Button>
          {isAdmin && (
            <Button type="button" variant="outline" onClick={handleDelete}>
              {es.comun.eliminar}
            </Button>
          )}
        </div>
      </form>

      <section className="rounded-lg border border-dashed border-line bg-canvas p-4 text-sm text-muted">
        <h2 className="mb-1 font-semibold text-ink">{t.faseTresTitulo}</h2>
        <p>{t.faseTresTexto}</p>
      </section>
      </>
      )}
    </div>
  );
}
