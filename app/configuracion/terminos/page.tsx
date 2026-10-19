"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { es } from "@/lib/i18n/es";
import { useCurrentRole } from "@/lib/currentRole";
import { fetchTermsPreview, getTerms, saveTerms, type TermsSettings } from "@/lib/termsApi";
import { saveBlob } from "@/lib/invoiceDocs";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const t = es.terminos;

interface Draft {
  sections: Record<string, string>;
  enabledQuote: boolean;
  enabledInvoice: boolean;
}

function toDraft(s: TermsSettings): Draft {
  return { sections: { ...s.sections }, enabledQuote: s.enabled_quote, enabledInvoice: s.enabled_invoice };
}

export default function TerminosPage() {
  const { isAdmin, loading: roleLoading } = useCurrentRole();
  const [settings, setSettings] = useState<TermsSettings | null>(null);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await getTerms();
      setSettings(s);
      setSaved(toDraft(s));
      setDraft(toDraft(s));
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
        <h1 className="sr-only">Términos</h1>
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

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const setSection = (key: string, value: string) => setDraft({ ...draft, sections: { ...draft.sections, [key]: value } });

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveTerms(draft!.sections, draft!.enabledQuote, draft!.enabledInvoice);
      // Keep titles/order/defaults from the loaded settings if the response omits them.
      const res = { ...settings, ...saved } as TermsSettings;
      setSettings(res);
      setSaved(toDraft(res));
      setDraft(toDraft(res));
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
      const blob = await fetchTermsPreview(draft!.sections);
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

      {settings.is_default && (
        <p role="status" className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {t.bannerBorrador}
        </p>
      )}

      <section className="mb-6 rounded-lg border border-line bg-surface p-4 shadow-card">
        <label className="mb-2 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={draft.enabledQuote}
            onChange={(e) => setDraft({ ...draft, enabledQuote: e.target.checked })}
          />
          {t.mostrarCotizacion}
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={draft.enabledInvoice}
            onChange={(e) => setDraft({ ...draft, enabledInvoice: e.target.checked })}
          />
          {t.mostrarFactura}
        </label>
        <p className="mt-2 text-xs text-muted">{t.apagado}</p>
      </section>

      <div className="grid gap-4">
        {settings.order.map((key) => (
          <section key={key} className="rounded-lg border border-line bg-surface p-4 shadow-card">
            <div className="mb-1 flex items-center justify-between gap-2">
              <label htmlFor={`sec-${key}`} className="text-sm font-semibold text-ink">
                {t.secciones[key] ?? settings.titles[key] ?? key}
              </label>
              <button
                type="button"
                className="text-xs text-accent underline disabled:opacity-40"
                disabled={draft.sections[key] === settings.defaults[key]}
                onClick={() => setSection(key, settings.defaults[key])}
              >
                {t.restaurarSeccion}
              </button>
            </div>
            <textarea
              id={`sec-${key}`}
              rows={5}
              maxLength={3000}
              value={draft.sections[key] ?? ""}
              onChange={(e) => setSection(key, e.target.value)}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </section>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{t.vacioNota}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving ? es.comun.guardando : t.guardar}
        </Button>
        <Button variant="outline" onClick={handlePreview} disabled={previewing}>
          {previewing ? t.generando : t.vistaPrevia}
        </Button>
        <span className="text-xs text-muted">{dirty ? t.cambiosPendientes : t.sinCambios}</span>
      </div>

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
                <Button onClick={() => saveBlob(preview.blob, "terminos_vista_previa.pdf")}>{t.descargar}</Button>
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
