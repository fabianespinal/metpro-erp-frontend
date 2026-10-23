"use client";

import { es } from "@/lib/i18n/es";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCurrentRole } from "@/lib/currentRole";
import { formatMoney } from "@/lib/takeOffLines";
import { takeOffInputClass, TotalRow } from "@/components/quotes/takeoff/LineCard";
import { ParityPanel } from "@/components/quotes/estimate/ParityPanel";
import {
  calculateEstimate,
  estimatorErrorMessage,
  generateEstimate,
  getEstimatorEnabled,
  listEstimateProfiles,
  type EstimatePreview,
  type EstimateProfile,
  type ProfileRole,
} from "@/lib/estimatorApi";
import {
  DEFAULT_FORM,
  NUMBER_FIELDS,
  buildRequest,
  formProblem,
  overrideProblemRow,
  warningText,
  type EstimateForm,
  type NumberField,
  type OverrideDrafts,
} from "@/lib/estimatorCalc";

interface Client { id: number; company_name: string }
interface Contact { id: number; name: string; email?: string | null }

const FIELD_LABEL: Record<NumberField, string> = {
  ancho: es.est.ancho,
  largo: es.est.largo,
  altura_laterales: es.est.alturaLaterales,
  altura_techado_lateral: es.est.alturaTechado,
  distancia_ejes: es.est.distanciaEjes,
  columnas_frontales: es.est.columnasFrontales,
};
const ROLE_LABEL: Record<ProfileRole, string> = {
  columnas: es.est.perfilColumnas,
  frontales: es.est.perfilFrontales,
  tijerillas: es.est.perfilTijerillas,
  frenado: es.est.perfilFrenado,
};
const POUND_LABEL: Record<string, string> = {
  columnas: es.est.libraColumnas,
  frenado: es.est.libraFrenado,
  tijerillas: es.est.libraTijerillas,
  frontales: es.est.libraFrontales,
  conexiones: es.est.libraConexiones,
};

export default function EstimatePage() {
  const router = useRouter();
  const { isAdmin, loading: roleLoading } = useCurrentRole();
  const [enabled, setEnabled] = useState<boolean | null>(null);

  const [profiles, setProfiles] = useState<EstimateProfile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [clientId, setClientId] = useState("");
  const [contactId, setContactId] = useState("");
  const [project, setProject] = useState("");
  const [notes, setNotes] = useState("");

  const [form, setForm] = useState<EstimateForm>(DEFAULT_FORM);
  const [drafts, setDrafts] = useState<OverrideDrafts>({});
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const [previewRaw, setPreview] = useState<EstimatePreview | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [doneKey, setDoneKey] = useState("");
  const [genError, setGenError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const request = useMemo(() => buildRequest(form, drafts), [form, drafts]);
  const calculating = Boolean(request) && doneKey !== (request ? JSON.stringify(request) : "");
  const preview = request ? previewRaw : null; // invalid form shows no result
  const requestKey = request ? JSON.stringify(request) : "";
  const idemKey = useRef<string>("");
  useEffect(() => {
    idemKey.current = crypto.randomUUID(); // new key whenever the content changes
  }, [requestKey, clientId, contactId, project, notes]);

  useEffect(() => {
    if (roleLoading || !isAdmin) return;
    getEstimatorEnabled().then(setEnabled);
  }, [roleLoading, isAdmin]);

  useEffect(() => {
    if (!enabled) return;
    listEstimateProfiles().then((p) => setProfiles(Array.isArray(p) ? p : [])).catch((e) => setCalcError(estimatorErrorMessage(e)));
    api("/clients").then((d) => setClients(Array.isArray(d) ? (d as Client[]) : [])).catch(() => setClients([]));
  }, [enabled]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    api(`/contacts/company/${clientId}`)
      .then((d) => { if (!cancelled) setContacts(Array.isArray(d) ? (d as Contact[]) : []); })
      .catch(() => { if (!cancelled) setContacts([]); });
    return () => { cancelled = true; };
  }, [clientId]);

  useEffect(() => {
    if (!enabled || !request) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      calculateEstimate(request)
        .then((p) => { if (!cancelled) { setPreview(p); setCalcError(null); } })
        .catch((e) => {
          if (cancelled) return;
          setPreview(null);
          setCalcError(estimatorErrorMessage(e));
          if ((e as { code?: string })?.code === "ESTIMATOR_DISABLED") setEnabled(false);
        })
        .finally(() => { if (!cancelled) setDoneKey(requestKey); });
    }, 350);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [enabled, requestKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const problem = formProblem(form);
  const badRow = overrideProblemRow(drafts);
  const canGenerate = Boolean(request && preview && clientId && contactId && !generating);

  function setNum(f: NumberField, v: string) { setForm((p) => ({ ...p, [f]: v })); }
  function setProfile(r: ProfileRole, v: string) { setForm((p) => ({ ...p, perfiles: { ...p.perfiles, [r]: v } })); }
  function patchDraft(row: number, patch: Partial<OverrideDrafts[number]>) {
    setDrafts((p) => ({ ...p, [row]: { ...({ unit_price: "", quantity: "", reason: "" } as OverrideDrafts[number]), ...p[row], ...patch } }));
  }
  function clearDraft(row: number) {
    setDrafts((p) => { const n = { ...p }; delete n[row]; return n; });
    setOpen((p) => ({ ...p, [row]: false }));
  }

  async function handleGenerate() {
    if (!request || !canGenerate) return;
    setGenerating(true);
    setGenError(null);
    try {
      const r = await generateEstimate({
        ...request,
        idempotency_key: idemKey.current,
        client_id: Number(clientId),
        contact_id: Number(contactId),
        project_name: project.trim() || null,
        notes: notes.trim() || null,
      });
      router.push(`/quotes/${r.quote_id}/edit`);
    } catch (e) {
      setGenError(estimatorErrorMessage(e));
      setGenerating(false);
    }
  }

  const sections = useMemo(() => {
    const out: Array<{ name: string; lines: EstimatePreview["lines"] }> = [];
    for (const ln of preview?.lines ?? []) {
      let s = out.find((x) => x.name === ln.section);
      if (!s) { s = { name: ln.section, lines: [] }; out.push(s); }
      s.lines.push(ln);
    }
    return out;
  }, [preview]);

  const header = (
    <PageHeader
      title={es.est.titulo}
      subtitle={es.est.subtitulo}
      actions={<Button asChild variant="outline"><Link href="/quotes">{es.est.volver}</Link></Button>}
    />
  );

  if (roleLoading) return <div className="mx-auto max-w-5xl px-4 py-6"><p className="text-sm text-muted">{es.est.cargando}</p></div>;
  if (!isAdmin) return <div className="mx-auto max-w-5xl px-4 py-6">{header}<Alert variant="destructive"><AlertDescription>{es.est.soloAdmin}</AlertDescription></Alert></div>;
  if (enabled === null) return <div className="mx-auto max-w-5xl px-4 py-6">{header}<p className="text-sm text-muted">{es.est.cargando}</p></div>;
  if (!enabled) return <div className="mx-auto max-w-5xl px-4 py-6">{header}<Alert><AlertDescription>{es.est.desactivado}</AlertDescription></Alert></div>;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      {header}

      <section className="mb-6" aria-labelledby="est-datos">
        <h2 id="est-datos" className="mb-3 text-base font-semibold text-ink">{es.est.datos}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">{es.est.cliente}</span>
            <select className={takeOffInputClass} value={clientId} onChange={(e) => { setClientId(e.target.value); setContactId(""); setContacts([]); }}>
              <option value="">{es.cot.seleccioneCliente}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">{es.est.contacto}</span>
            <select className={takeOffInputClass} value={contactId} onChange={(e) => setContactId(e.target.value)} disabled={!clientId}>
              <option value="">{!clientId ? es.cot.seleccioneClientePrimero : contacts.length === 0 ? es.cot.sinContactos : es.cot.seleccioneContacto}</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.email ? ` — ${c.email}` : ""}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">{es.est.proyecto}</span>
            <input className={takeOffInputClass} value={project} maxLength={200} onChange={(e) => setProject(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">{es.est.notas}</span>
            <input className={takeOffInputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="mb-6" aria-labelledby="est-entradas">
        <h2 id="est-entradas" className="mb-1 text-base font-semibold text-ink">{es.est.entradas}</h2>
        <p className="mb-3 text-xs text-muted">{es.est.unidadesSupuesto}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NUMBER_FIELDS.map((f) => (
            <label key={f} className="block text-xs text-muted">
              {FIELD_LABEL[f]}
              <input className={takeOffInputClass} inputMode="decimal" value={form[f]} onChange={(e) => setNum(f, e.target.value)} />
            </label>
          ))}
        </div>
        <h3 className="mb-2 mt-4 text-sm font-medium text-ink">{es.est.perfiles}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(ROLE_LABEL) as ProfileRole[]).map((r) => (
            <label key={r} className="block text-xs text-muted">
              {ROLE_LABEL[r]}
              <select className={takeOffInputClass} value={form.perfiles[r]} onChange={(e) => setProfile(r, e.target.value)}>
                {!profiles.some((p) => p.designation === form.perfiles[r]) ? <option value={form.perfiles[r]}>{form.perfiles[r]}</option> : null}
                {profiles.map((p) => <option key={p.designation} value={p.designation}>{p.display_designation || p.designation} ({p.lb_per_ft} lb/ft)</option>)}
              </select>
            </label>
          ))}
        </div>
        {problem ? <p className="mt-3 text-sm text-red-600">{problem}</p> : null}
      </section>

      <section className="mb-6" aria-labelledby="est-resultado">
        <h2 id="est-resultado" className="mb-3 text-base font-semibold text-ink">{es.est.resultado}</h2>
        {calcError ? <Alert variant="destructive" className="mb-3"><AlertDescription>{calcError}</AlertDescription></Alert> : null}
        {calculating ? <p className="text-sm text-muted">{es.est.calculando}</p> : null}
        {!preview && !calculating && !calcError ? <p className="text-sm text-muted">{es.est.sinResultado}</p> : null}

        {preview ? (
          <div className="space-y-4">
            {preview.warnings.length > 0 ? (
              <Alert><AlertDescription>
                <p className="mb-1 font-medium">{es.est.advertencias}</p>
                <ul className="list-disc pl-5">{preview.warnings.map((w) => <li key={w.code}>{warningText(w)}</li>)}</ul>
              </AlertDescription></Alert>
            ) : null}

            <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
              <h3 className="mb-2 text-sm font-semibold text-ink">{es.est.libras}</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-5">
                {Object.entries(preview.pounds_by_role).map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted">{POUND_LABEL[k] ?? k}</dt><dd data-testid={`lb-${k}`}>{v.toLocaleString("en-US", { maximumFractionDigits: 2 })}</dd></div>
                ))}
              </dl>
            </div>

            {sections.map((s) => (
              <div key={s.name} className="rounded-lg border border-line bg-surface p-4 shadow-card">
                <h3 className="mb-2 text-sm font-semibold text-ink">{s.name}</h3>
                <ul className="divide-y divide-line">
                  {s.lines.map((ln) => {
                    const d = drafts[ln.row];
                    return (
                      <li key={ln.row} className="py-2 text-sm" data-testid={`line-${ln.row}`}>
                        <div className="grid grid-cols-12 items-baseline gap-2">
                          <span className="col-span-12 text-ink sm:col-span-5">{ln.description}</span>
                          <span className="col-span-4 text-right sm:col-span-2" data-testid={`qty-${ln.row}`}>{ln.quantity === null ? "—" : ln.quantity.toLocaleString("en-US", { maximumFractionDigits: 3 })}</span>
                          <span className="col-span-4 text-right sm:col-span-2">{formatMoney(ln.unit_price)}</span>
                          <span className="col-span-4 text-right font-medium sm:col-span-3" data-testid={`total-${ln.row}`}>{formatMoney(ln.total)}</span>
                        </div>
                        <button type="button" className="mt-1 text-xs text-accent underline" onClick={() => setOpen((p) => ({ ...p, [ln.row]: !p[ln.row] }))}>
                          {es.est.cambiar}
                        </button>
                        {open[ln.row] || d ? (
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <label className="block text-xs text-muted">{es.est.nuevoPrecio}
                              <input className={takeOffInputClass} inputMode="decimal" value={d?.unit_price ?? ""} onChange={(e) => patchDraft(ln.row, { unit_price: e.target.value })} />
                            </label>
                            <label className="block text-xs text-muted">{es.est.nuevaCantidad}
                              <input className={takeOffInputClass} inputMode="decimal" value={d?.quantity ?? ""} onChange={(e) => patchDraft(ln.row, { quantity: e.target.value })} />
                            </label>
                            <label className="col-span-2 block text-xs text-muted">{es.est.motivo}
                              <input className={takeOffInputClass} value={d?.reason ?? ""} onChange={(e) => patchDraft(ln.row, { reason: e.target.value })} />
                            </label>
                            <button type="button" className="text-left text-xs text-muted underline" onClick={() => clearDraft(ln.row)}>{es.est.quitarCambio}</button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <p className="text-xs text-muted">{es.est.cantidadCotizacion}</p>

            <div className="rounded-lg border border-line bg-surface p-4 shadow-card">
              <h3 className="mb-2 text-sm font-semibold text-ink">{es.est.totales}</h3>
              <dl className="space-y-1 text-sm">
                <TotalRow label={es.cot.panelSubtotal} value={preview.totals_preview.subtotal} />
                <TotalRow label={preview.totals_preview.tax_label ?? es.est.impuesto} value={preview.totals_preview.tax_amount} />
                <TotalRow label={es.cot.panelTotal} value={preview.totals_preview.grand_total} strong />
              </dl>
            </div>

            <ParityPanel preview={preview} />
          </div>
        ) : null}
      </section>

      {badRow !== null ? <p className="mb-2 text-sm text-red-600">{es.est.cambioSinMotivo(badRow)}</p> : null}
      {genError ? <Alert variant="destructive" className="mb-3"><AlertDescription>{genError}</AlertDescription></Alert> : null}
      <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">{canGenerate ? "" : es.est.falta}</p>
        <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full sm:w-auto">
          {generating ? es.est.generando : es.est.generar}
        </Button>
      </div>
    </div>
  );
}
