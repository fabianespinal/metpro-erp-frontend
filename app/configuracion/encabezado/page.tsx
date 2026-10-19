"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { es } from "@/lib/i18n/es";
import { useCurrentRole } from "@/lib/currentRole";
import {
  fetchCoverPreview,
  getCoverSettings,
  saveCoverTemplate,
  type CoverDocType,
  type CoverSettings,
} from "@/lib/coverPageApi";
import { saveBlob } from "@/lib/invoiceDocs";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const t = es.portada;
const TABS: { key: CoverDocType; label: string }[] = [
  { key: "quote", label: t.cotizacion },
  { key: "invoice", label: t.factura },
];

interface Draft {
  body: string;
  enabled: boolean;
}

export default function EncabezadoPage() {
  const { isAdmin, loading: roleLoading } = useCurrentRole();
  const [settings, setSettings] = useState<CoverSettings | null>(null);
  const [saved, setSaved] = useState<Record<CoverDocType, Draft> | null>(null);
  const [draft, setDraft] = useState<Record<CoverDocType, Draft> | null>(null);
  const [tab, setTab] = useState<CoverDocType>("quote");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    try {
      const s = await getCoverSettings();
      const byType = Object.fromEntries(s.templates.map((x) => [x.doc_type, { body: x.body, enabled: x.enabled }])) as Record<
        CoverDocType,
        Draft
      >;
      setSettings(s);
      setSaved(byType);
      setDraft(byType);
    } catch (e) {
      setError(`${t.errorCargar}: ${(e as Error).message}`);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  if (roleLoading) return <p className="p-6 text-sm text-muted">{es.comun.cargando}</p>;
  if (!isAdmin) {
    return (
      <div>
        <h1 className="sr-only">Encabezado</h1>
        <p role="alert" className="m-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {t.soloAdmin}
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <p role="alert" className="m-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (!settings || !saved || !draft) return <p className="p-6 text-sm text-muted">{es.comun.cargando}</p>;

  const current = draft[tab];
  const dirty = current.body !== saved[tab].body || current.enabled !== saved[tab].enabled;
  const usingDefault = current.body === settings.defaults[tab];

  const update = (patch: Partial<Draft>) => setDraft({ ...draft, [tab]: { ...current, ...patch } });

  function insertField(name: string) {
    const el = areaRef.current;
    const token = `{${name}}`;
    if (!el) return update({ body: current.body + token });
    const start = el.selectionStart ?? current.body.length;
    const end = el.selectionEnd ?? start;
    const next = current.body.slice(0, start) + token + current.body.slice(end);
    update({ body: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await saveCoverTemplate(tab, current.body, current.enabled);
      setSaved({ ...saved!, [tab]: { body: res.body, enabled: res.enabled } });
      setDraft({ ...draft!, [tab]: { body: res.body, enabled: res.enabled } });
      toast.success(t.guardado);
    } catch (e) {
      toast.error(`${t.errorGuardar}: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handlePreview() {
    setPreviewing(true);
    try {
      const blob = await fetchCoverPreview(tab, current.body);
      setPreview({ blob, url: URL.createObjectURL(blob) });
    } catch (e) {
      toast.error(`${t.errorVistaPrevia}: ${(e as Error).message}`);
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader title={t.titulo} subtitle={t.subtitulo} />

      <div role="tablist" className="mb-4 flex gap-2 border-b border-line">
        {TABS.map((x) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={tab === x.key}
            onClick={() => setTab(x.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === x.key ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
        <label className="mb-4 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={current.enabled} onChange={(e) => update({ enabled: e.target.checked })} />
          {t.mostrar}
        </label>

        <p className="mb-3 text-xs text-muted">{t.estructuraFija}</p>

        <div className="mb-3">
          <p className="mb-1 text-sm font-medium text-ink">{t.camposTitulo}</p>
          <div className="flex flex-wrap gap-2">
            {settings.fields[tab].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => insertField(f)}
                className="rounded-md border border-line bg-canvas px-2 py-1 text-xs text-ink hover:border-accent"
                title={`{${f}}`}
              >
                {t.campos[f] ?? f}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">{t.camposNota}</p>
        </div>

        <label htmlFor="portada-texto" className="mb-1 block text-sm font-medium text-ink">
          {t.textoLabel}
        </label>
        <textarea
          id="portada-texto"
          ref={areaRef}
          rows={18}
          maxLength={2500}
          value={current.body}
          onChange={(e) => update({ body: e.target.value })}
          className="w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <p className="mt-1 text-xs text-muted">
          {usingDefault ? t.textoPorDefecto : ""} {dirty ? t.cambiosPendientes : t.sinCambios}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={saving || !dirty}>
            {saving ? es.comun.guardando : t.guardar}
          </Button>
          <Button variant="outline" onClick={handlePreview} disabled={previewing}>
            {previewing ? t.generando : t.vistaPrevia}
          </Button>
          <Button variant="outline" onClick={() => update({ body: settings.defaults[tab] })} disabled={usingDefault}>
            {t.restaurar}
          </Button>
        </div>
      </section>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={t.vistaPreviaTitulo}
          onClick={() => setPreview(null)}
        >
          <div
            className="flex h-full max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h2 className="text-base font-semibold text-ink">{t.vistaPreviaTitulo}</h2>
              <div className="flex gap-2">
                <Button onClick={() => saveBlob(preview.blob, `portada_${tab}_vista_previa.pdf`)}>{t.descargar}</Button>
                <Button variant="outline" onClick={() => setPreview(null)}>
                  {t.cerrar}
                </Button>
              </div>
            </div>
            <iframe title={t.vistaPreviaTitulo} src={preview.url} className="h-full w-full flex-1 bg-white" />
          </div>
        </div>
      )}
    </div>
  );
}
