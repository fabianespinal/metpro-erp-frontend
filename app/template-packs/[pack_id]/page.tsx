"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getTemplatePack } from "@/lib/quotingApi";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TemplatePack {
  id: number;
  name: string;
  description?: string | null;
  categories: Array<{
    id: number;
    name: string;
    sort_order: number;
    items: Array<{
      id: number;
      product_id: number;
      product_name?: string | null;
      unit_price?: number | null;
      default_qty: number;
      optional: boolean;
      sort_order: number;
    }>;
  }>;
  created_at?: string | null;
  updated_at?: string | null;
}

export default function TemplatePackEditPage() {
  const params = useParams();
  const router = useRouter();
  const packId = params.pack_id as string;

  const [pack, setPack] = useState<TemplatePack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Load pack
  useEffect(() => {
    let cancelled = false;
    const loadPack = async () => {
      try {
        const data = await getTemplatePack(parseInt(packId));
        if (!cancelled) {
          setPack(data);
          setName(data.name);
          setDescription(data.description || "");
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load template pack");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPack();
    return () => {
      cancelled = true;
    };
  }, [packId]);

  // Save changes
  const handleSave = async () => {
    if (!pack) return;
    setSaving(true);
    try {
      await api(`/template-packs/${packId}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          description: description || null,
          categories: pack.categories,
        }),
      });
      setError(null);
      router.push("/template-packs");
    } catch (err: any) {
      setError(err.message || "Failed to save template pack");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <PageHeader
        title="Edit Template Pack"
        subtitle={pack?.name || "Loading..."}
        actions={
          <Button variant="outline" onClick={() => router.push("/template-packs")}>
            Back
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading template pack...</p>
      ) : pack ? (
        <div className="space-y-6">
          {/* BASIC INFO */}
          <div className="rounded-lg border border-line bg-surface p-6">
            <h3 className="mb-4 text-lg font-semibold text-ink">Basic Information</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Pack Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={saving}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={saving}
                />
              </label>
            </div>
          </div>

          {/* CATEGORIES */}
          <div className="rounded-lg border border-line bg-surface p-6">
            <h3 className="mb-4 text-lg font-semibold text-ink">Categories ({pack.categories.length})</h3>
            {pack.categories.length === 0 ? (
              <p className="text-sm text-muted">No categories yet. Add one from the admin panel.</p>
            ) : (
              <div className="space-y-4">
                {pack.categories.map((cat) => (
                  <div key={cat.id} className="rounded border border-line bg-canvas p-3">
                    <h4 className="font-semibold text-ink">{cat.name}</h4>
                    <p className="mt-1 text-xs text-muted">{cat.items.length} items</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SAVE */}
          <div className="flex gap-3 border-t border-line pt-4">
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/template-packs")} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
