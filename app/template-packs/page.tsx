"use client";

import { es } from "@/lib/i18n/es";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCurrentRole } from "@/lib/currentRole";

interface TemplatePack {
  id: number;
  name: string;
  description?: string | null;
  category_count: number;
  item_count: number;
  updated_at?: string;
}

interface CreateFormData {
  name: string;
  description: string;
}

export default function TemplatePacksPage() {
  const { isAdmin } = useCurrentRole();
  const [packs, setPacks] = useState<TemplatePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateFormData>({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Load packs
  useEffect(() => {
    let cancelled = false;
    const loadPacks = async () => {
      try {
        const data = await api("/template-packs");
        if (!cancelled) {
          setPacks(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || es.pl.errorCargar);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPacks();
    return () => {
      cancelled = true;
    };
  }, []);

  // Create pack
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(es.pl.errorNombre);
      return;
    }

    setCreating(true);
    try {
      const newPack = (await api("/template-packs", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          categories: [],
        }),
      })) as TemplatePack;
      setPacks([...packs, newPack]);
      setFormData({ name: "", description: "" });
      setShowForm(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || es.pl.errorCrear);
    } finally {
      setCreating(false);
    }
  };

  // Delete pack
  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await api(`/template-packs/${deleteId}`, { method: "DELETE" });
      setPacks(packs.filter((p) => p.id !== deleteId));
      setDeleteId(null);
      setDeleteConfirm(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || es.pl.errorEliminar);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader
        title={es.pl.titulo}
        subtitle={es.pl.subtitulo}
        actions={
          isAdmin ? (
            <Button asChild>
              <Link href="/template-packs/new">{es.pl.crearPaquete}</Link>
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* CREATE FORM */}
      {showForm && (
        <div className="mb-8 rounded-lg border border-line bg-surface p-6">
          <h3 className="mb-4 text-lg font-semibold text-ink">{es.pl.nuevoPaquete}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">{es.pl.nombreReq}</span>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={es.pl.phNombre}
                className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={creating}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">{es.pl.descripcion}</span>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={es.pl.phDescripcion}
                rows={3}
                className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={creating}
              />
            </label>

            <div className="flex gap-3">
              <Button type="submit" disabled={creating || !formData.name.trim()}>
                {creating ? es.pl.creando : es.pl.crear}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={creating}
              >
                {es.pl.cancelar}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* PACKS LIST */}
      {loading ? (
        <p className="text-sm text-muted">{es.pl.cargando}</p>
      ) : packs.length === 0 ? (
        <p className="text-sm text-muted">{es.pl.vacio}</p>
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => (
            <div key={pack.id} className="flex items-center justify-between rounded-lg border border-line bg-surface p-4">
              <div>
                <h4 className="font-semibold text-ink">{pack.name}</h4>
                {pack.item_count === 0 && (
                  <p className="text-xs font-medium text-amber-700">{es.pl.paqueteVacio}</p>
                )}
                {pack.description && <p className="text-sm text-muted">{pack.description}</p>}
                <p className="mt-1 text-xs text-muted">
                  {es.pl.resumen(pack.category_count, pack.item_count)}
                </p>
              </div>

              {isAdmin && (
              <div className="flex gap-2">
                <Link href={`/template-packs/${pack.id}/edit`}>
                  <Button variant="outline" size="sm">
                    {es.pl.editar}
                  </Button>
                </Link>
                <button
                  onClick={() => {
                    setDeleteId(pack.id);
                    setDeleteConfirm(true);
                  }}
                  className="rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  {es.pl.eliminar}
                </button>
              </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-ink mb-2">{es.pl.eliminarTitulo}</h3>
            <p className="text-sm text-muted mb-6">
              {es.pl.eliminarTexto}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                {es.pl.eliminar}
              </button>
              <button
                onClick={() => {
                  setDeleteConfirm(false);
                  setDeleteId(null);
                }}
                className="flex-1 rounded border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-canvas transition-colors"
              >
                {es.pl.cancelar}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
