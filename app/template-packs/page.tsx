"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
          setError(err.message || "Failed to load template packs");
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
      setError("Pack name is required");
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
      setError(err.message || "Failed to create template pack");
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
      setError(err.message || "Failed to delete template pack");
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Template Packs"
        subtitle="Create and manage quote template packs"
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Create Pack"}
          </Button>
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
          <h3 className="mb-4 text-lg font-semibold text-ink">New Template Pack</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">Pack Name *</span>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Steel Structure"
                className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={creating}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink">Description</span>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
                className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={creating}
              />
            </label>

            <div className="flex gap-3">
              <Button type="submit" disabled={creating || !formData.name.trim()}>
                {creating ? "Creating..." : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* PACKS LIST */}
      {loading ? (
        <p className="text-sm text-muted">Loading template packs...</p>
      ) : packs.length === 0 ? (
        <p className="text-sm text-muted">No template packs yet.</p>
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => (
            <div key={pack.id} className="flex items-center justify-between rounded-lg border border-line bg-surface p-4">
              <div>
                <h4 className="font-semibold text-ink">{pack.name}</h4>
                {pack.description && <p className="text-sm text-muted">{pack.description}</p>}
                <p className="mt-1 text-xs text-muted">
                  {pack.category_count} categories · {pack.item_count} items
                </p>
              </div>

              <div className="flex gap-2">
                <Link href={`/template-packs/${pack.id}`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
                <button
                  onClick={() => {
                    setDeleteId(pack.id);
                    setDeleteConfirm(true);
                  }}
                  className="rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && deleteId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-ink mb-2">Delete Pack?</h3>
            <p className="text-sm text-muted mb-6">
              Are you sure? This will remove the pack and all its categories and items.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setDeleteConfirm(false);
                  setDeleteId(null);
                }}
                className="flex-1 rounded border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-canvas transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
