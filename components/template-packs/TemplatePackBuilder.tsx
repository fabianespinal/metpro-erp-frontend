"use client";

import { es } from "@/lib/i18n/es";
/**
 * Template Pack Builder. Shared by /template-packs/new and /template-packs/[id]/edit.
 *
 * Backend contract (template_packs/models.py, PackIn):
 *   { name, description, categories: [{ name, sort_order, items: [{ product_id, default_qty, optional, sort_order }] }] }
 * PUT replaces the whole category/item tree in one transaction.
 * Unit price is read from the product catalog. The pack does not store a price override.
 * Writes are admin-only (enforced by the backend).
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getTemplatePack } from "@/lib/quotingApi";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCurrentRole } from "@/lib/currentRole";

interface Product {
  id: number;
  name: string;
  description?: string | null;
  unit_price: number;
}

interface DraftItem {
  key: string;
  product_id: number;
  default_qty: number;
  optional: boolean;
}

interface DraftCategory {
  key: string;
  name: string;
  items: DraftItem[];
}

let keySeq = 0;
const newKey = (p: string) => `${p}-${Date.now()}-${keySeq++}`;

const inputClass =
  "w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent";

const money = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function move<T>(arr: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= arr.length) return arr;
  const copy = [...arr];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

export default function TemplatePackBuilder({ packId }: { packId?: number }) {
  const router = useRouter();
  const isEdit = typeof packId === "number";
  const { isAdmin, loading: roleLoading } = useCurrentRole();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<DraftCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Product picker state: which category is adding, and the search text.
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const productData = await api("/products/");
        if (cancelled) return;
        setProducts(Array.isArray(productData) ? (productData as Product[]) : []);

        if (isEdit) {
          const pack = await getTemplatePack(packId as number);
          if (cancelled) return;
          setName(pack.name);
          setDescription(pack.description ?? "");
          setCategories(
            pack.categories.map((c) => ({
              key: newKey("cat"),
              name: c.name,
              items: c.items.map((i) => ({
                key: newKey("item"),
                product_id: i.product_id,
                default_qty: Number(i.default_qty),
                optional: i.optional,
              })),
            }))
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : es.pl.errorCargarDatos;
        console.error("Template pack builder load failed:", err);
        if (!cancelled) setLoadError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, packId]);

  const productById = useMemo(() => {
    const m = new Map<number, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q) ||
            String(p.id) === q
        )
      : products;
    return list.slice(0, 50);
  }, [products, search]);

  const totals = useMemo(() => {
    let required = 0;
    let optional = 0;
    let itemCount = 0;
    for (const c of categories) {
      for (const i of c.items) {
        itemCount += 1;
        const price = Number(productById.get(i.product_id)?.unit_price ?? 0);
        const line = price * i.default_qty;
        if (i.optional) optional += line;
        else required += line;
      }
    }
    return { required, optional, itemCount };
  }, [categories, productById]);

  // ---------- mutations ----------
  const update = (next: DraftCategory[]) => {
    setCategories(next);
    setDirty(true);
  };

  const addCategory = () =>
    update([...categories, { key: newKey("cat"), name: es.pl.categoriaN(categories.length + 1), items: [] }]);

  const patchCategory = (key: string, patch: Partial<DraftCategory>) =>
    update(categories.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const removeCategory = (key: string) => {
    const cat = categories.find((c) => c.key === key);
    if (cat && cat.items.length > 0 && !window.confirm(es.pl.confirmarQuitarCategoria(cat.name, cat.items.length))) {
      return;
    }
    update(categories.filter((c) => c.key !== key));
  };

  const moveCategory = (index: number, delta: number) => update(move(categories, index, delta));

  const addItem = (catKey: string, productId: number) => {
    update(
      categories.map((c) =>
        c.key === catKey
          ? { ...c, items: [...c.items, { key: newKey("item"), product_id: productId, default_qty: 1, optional: false }] }
          : c
      )
    );
    setPickerFor(null);
    setSearch("");
  };

  const patchItem = (catKey: string, itemKey: string, patch: Partial<DraftItem>) =>
    update(
      categories.map((c) =>
        c.key === catKey ? { ...c, items: c.items.map((i) => (i.key === itemKey ? { ...i, ...patch } : i)) } : c
      )
    );

  const removeItem = (catKey: string, itemKey: string) =>
    update(categories.map((c) => (c.key === catKey ? { ...c, items: c.items.filter((i) => i.key !== itemKey) } : c)));

  const moveItem = (catKey: string, index: number, delta: number) =>
    update(categories.map((c) => (c.key === catKey ? { ...c, items: move(c.items, index, delta) } : c)));

  // ---------- validation + save ----------
  const validationError = useMemo(() => {
    if (!name.trim()) return es.pl.nombreObligatorio;
    for (const c of categories) {
      if (!c.name.trim()) return es.pl.categoriaSinNombre;
      for (const i of c.items) {
        if (!(i.default_qty > 0)) return `Quantity must be greater than 0 in "${c.name}".`;
      }
    }
    return null;
  }, [name, categories]);

  const handleSave = async () => {
    if (validationError) {
      setSaveError(validationError);
      return;
    }
    setSaving(true);
    setSaveError(null);
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      categories: categories.map((c, ci) => ({
        name: c.name.trim(),
        sort_order: ci,
        items: c.items.map((i, ii) => ({
          product_id: i.product_id,
          default_qty: i.default_qty,
          optional: i.optional,
          sort_order: ii,
        })),
      })),
    };
    try {
      if (isEdit) {
        await api(`/template-packs/${packId}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await api("/template-packs/", { method: "POST", body: JSON.stringify(body) });
      }
      setDirty(false);
      router.push("/template-packs");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : es.pl.errorGuardar;
      console.error("Template pack save failed:", err);
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (dirty && !window.confirm(es.pl.descartar)) return;
    router.push("/template-packs");
  };

  // ---------- render ----------
  if (loading || roleLoading) return <p className="text-sm text-muted">{es.pl.cargandoEditor}</p>;

  // The API rejects create/update from non-admins; say so up front instead of after editing.
  if (!isAdmin) {
    return (
      <Alert>
        <AlertDescription>{es.pl.soloAdmin}</AlertDescription>
      </Alert>
    );
  }

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{es.pl.errorCargarEditor} {loadError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* BASIC INFO */}
      <section className="rounded-lg border border-line bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold text-ink">{es.pl.detalles}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">{es.pl.nombre}</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
              placeholder={es.pl.phNombreB}
              disabled={saving}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">{es.comun.descripcion}</span>
            <input
              className={inputClass}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDirty(true);
              }}
              placeholder={es.pl.phOpcional}
              disabled={saving}
            />
          </label>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            {es.pl.categoriasItems(categories.length, totals.itemCount)}
          </h2>
          <Button onClick={addCategory} disabled={saving}>
            {es.pl.agregarCategoria}
          </Button>
        </div>

        {categories.length === 0 && (
          <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
            {es.pl.sinCategorias}
          </p>
        )}

        {categories.map((cat, ci) => (
          <div key={cat.key} className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                className={`${inputClass} flex-1 min-w-[12rem] font-medium`}
                value={cat.name}
                onChange={(e) => patchCategory(cat.key, { name: e.target.value })}
                aria-label={es.pl.nombreCategoria}
                disabled={saving}
              />
              <Button variant="outline" size="sm" onClick={() => moveCategory(ci, -1)} disabled={saving || ci === 0} aria-label={es.pl.subirCategoria}>
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveCategory(ci, 1)}
                disabled={saving || ci === categories.length - 1}
                aria-label={es.pl.bajarCategoria}
              >
                ↓
              </Button>
              <button
                type="button"
                onClick={() => removeCategory(cat.key)}
                disabled={saving}
                className="rounded px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                {es.pl.quitar}
              </button>
            </div>

            {cat.items.length === 0 ? (
              <p className="mb-3 text-sm text-muted">{es.pl.sinItems}</p>
            ) : (
              <div className="mb-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase text-muted">
                      <th className="py-2 pr-2">{es.pl.colProducto}</th>
                      <th className="py-2 pr-2 text-right">{es.pl.colPrecio}</th>
                      <th className="py-2 pr-2 text-right">{es.pl.colCantidad}</th>
                      <th className="py-2 pr-2 text-right">{es.pl.colLinea}</th>
                      <th className="py-2 pr-2 text-center">{es.pl.colOpcional}</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {cat.items.map((item, ii) => {
                      const product = productById.get(item.product_id);
                      const price = Number(product?.unit_price ?? 0);
                      return (
                        <tr key={item.key}>
                          <td className="py-2 pr-2">
                            {product ? product.name : <span className="text-red-600">{es.pl.productoFaltante(item.product_id)}</span>}
                          </td>
                          <td className="py-2 pr-2 text-right">${money(price)}</td>
                          <td className="py-2 pr-2 text-right">
                            <input
                              type="number"
                              min={0.01}
                              step="any"
                              className="w-24 rounded-md border border-line bg-canvas px-2 py-1 text-right text-sm"
                              value={item.default_qty}
                              onChange={(e) => patchItem(cat.key, item.key, { default_qty: Number(e.target.value) })}
                              aria-label={es.pl.cantidadDefecto}
                              disabled={saving}
                            />
                          </td>
                          <td className="py-2 pr-2 text-right">${money(price * (item.default_qty || 0))}</td>
                          <td className="py-2 pr-2 text-center">
                            <input
                              type="checkbox"
                              checked={item.optional}
                              onChange={(e) => patchItem(cat.key, item.key, { optional: e.target.checked })}
                              aria-label={es.pl.itemOpcional}
                              disabled={saving}
                            />
                          </td>
                          <td className="whitespace-nowrap py-2 text-right">
                            <button type="button" className="px-1 text-muted hover:text-ink disabled:opacity-30" onClick={() => moveItem(cat.key, ii, -1)} disabled={saving || ii === 0} aria-label={es.pl.subirItem}>
                              ↑
                            </button>
                            <button
                              type="button"
                              className="px-1 text-muted hover:text-ink disabled:opacity-30"
                              onClick={() => moveItem(cat.key, ii, 1)}
                              disabled={saving || ii === cat.items.length - 1}
                              aria-label={es.pl.bajarItem}
                            >
                              ↓
                            </button>
                            <button type="button" className="ml-2 px-1 text-red-600 hover:underline" onClick={() => removeItem(cat.key, item.key)} disabled={saving}>
                              {es.pl.quitar}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {pickerFor === cat.key ? (
              <div className="rounded-md border border-line bg-canvas p-3">
                <div className="mb-2 flex gap-2">
                  <input
                    autoFocus
                    className={inputClass}
                    placeholder={es.pl.buscarProductos(products.length)}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPickerFor(null);
                      setSearch("");
                    }}
                  >
                    {es.pl.cerrar}
                  </Button>
                </div>
                <ul className="max-h-64 divide-y divide-line overflow-y-auto">
                  {filteredProducts.length === 0 && <li className="py-2 text-sm text-muted">{es.pl.sinCoincidencias}</li>}
                  {filteredProducts.map((p) => {
                    const already = cat.items.some((i) => i.product_id === p.id);
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => addItem(cat.key, p.id)}
                          className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left text-sm hover:bg-surface"
                        >
                          <span>
                            <span className="text-ink">{p.name}</span>
                            {already && <span className="ml-2 text-xs text-muted">{es.pl.yaEnCategoria}</span>}
                          </span>
                          <span className="text-muted">${money(Number(p.unit_price))}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {products.length > 50 && !search && (
                  <p className="mt-2 text-xs text-muted">{es.pl.primeros50}</p>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPickerFor(cat.key);
                  setSearch("");
                }}
                disabled={saving}
              >
                {es.pl.agregarProducto}
              </Button>
            )}
          </div>
        ))}
      </section>

      {/* SUMMARY + SAVE */}
      <section className="flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted">
          {es.pl.requeridos} <span className="font-semibold text-ink">${money(totals.required)}</span>
          {totals.optional > 0 && <> · {es.pl.opcionales} ${money(totals.optional)}</>}
          <div className="text-xs">{es.pl.aviso}</div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            {es.pl.cancelar}
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? es.pl.guardando : isEdit ? es.pl.guardarCambios : es.pl.crearPaquete}
          </Button>
        </div>
      </section>
    </div>
  );
}
