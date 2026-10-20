"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { es } from "@/lib/i18n/es";
import { useCurrentRole } from "@/lib/currentRole";
import { fetchSealImage, getSealSettings, setSealDefault, uploadSealImage, type SealSettings } from "@/lib/sealApi";
import { setSealSettingsCache } from "@/lib/useSealSettings";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const t = es.sello;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg"];

export default function SelloPage() {
  const { isAdmin, loading: roleLoading } = useCurrentRole();
  const [settings, setSettings] = useState<SealSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep one object URL for the preview and release it when it changes or the page closes.
  const showImage = useCallback(async (configured: boolean) => {
    if (!configured) {
      setImageUrl(null);
      return;
    }
    try {
      setImageUrl(URL.createObjectURL(await fetchSealImage()));
    } catch {
      setImageUrl(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const load = useCallback(async () => {
    try {
      const s = await getSealSettings();
      setSettings(s);
      setSealSettingsCache(s);
      await showImage(s.configured);
    } catch (e) {
      setError(`${t.errorCargar}: ${(e as Error).message}`);
    }
  }, [showImage]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  if (roleLoading) return <p className="p-6 text-sm text-muted">{es.comun.cargando}</p>;
  if (!isAdmin) {
    return (
      <div>
        <h1 className="sr-only">{t.titulo}</h1>
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
  if (!settings) return <p className="p-6 text-sm text-muted">{es.comun.cargando}</p>;

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error(t.tipoNoValido);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t.archivoGrande);
      return;
    }
    setUploading(true);
    try {
      const s = await uploadSealImage(file);
      setSettings(s);
      setSealSettingsCache(s);
      await showImage(s.configured);
      toast.success(t.subido);
    } catch (err) {
      toast.error(`${t.errorSubir}: ${(err as Error).message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDefault(enabled: boolean) {
    setSavingDefault(true);
    try {
      const s = await setSealDefault(enabled);
      setSettings(s);
      setSealSettingsCache(s);
      toast.success(t.preferenciaGuardada);
    } catch (err) {
      toast.error(`${t.errorGuardar}: ${(err as Error).message}`);
    } finally {
      setSavingDefault(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={t.titulo} subtitle={t.subtitulo} />

      {!settings.storage_ready && (
        <p role="status" className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {t.sinAlmacenamiento}
        </p>
      )}

      <section className="mb-6 rounded-lg border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-3 text-sm font-semibold text-ink">{t.vistaPrevia}</h2>
        <div className="mb-4 flex min-h-40 items-center justify-center rounded-md border border-dashed border-line bg-canvas p-4">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={t.vistaPrevia} className="max-h-56 w-auto" />
          ) : (
            <p className="text-sm text-muted">{t.sinSello}</p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handlePick}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !settings.storage_ready}
        >
          {uploading ? t.subiendo : settings.configured ? t.reemplazar : t.subir}
        </Button>
        <p className="mt-2 text-xs text-muted">{t.formatoNota}</p>
      </section>

      <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={settings.enabled_by_default}
            disabled={savingDefault || !settings.configured}
            onChange={(e) => handleDefault(e.target.checked)}
          />
          {t.porDefecto}
        </label>
        <p className="mt-2 text-xs text-muted">{t.porDefectoNota}</p>
      </section>
    </div>
  );
}
