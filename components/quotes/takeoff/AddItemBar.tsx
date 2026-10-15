"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney, type TakeOffLine, newManualLine, newProductLine } from "@/lib/takeOffLines";
import { takeOffInputClass } from "@/components/quotes/takeoff/LineCard";
import type { ItemType } from "@/lib/quotingApi";

export interface CatalogProduct {
  id: number;
  name: string;
  unit_price: number;
}

/** Search the catalog, add a product line, or add a manual service or custom line. */
export function AddItemBar({
  products,
  onAdd,
}: {
  products: CatalogProduct[];
  onAdd: (line: TakeOffLine) => void;
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [products, query]);

  function addProduct(p: CatalogProduct) {
    onAdd(newProductLine(p));
    setQuery("");
  }

  function addManual(itemType: ItemType) {
    onAdd(newManualLine(itemType));
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-4 shadow-card">
      <h2 className="mb-3 text-sm font-semibold text-ink">Add item</h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className={takeOffInputClass}
            aria-label="Search products"
          />
          {matches.length > 0 ? (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-card">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => addProduct(p)}
                    className="flex w-full justify-between px-3 py-2 text-left text-sm text-ink hover:bg-canvas"
                  >
                    <span>{p.name}</span>
                    <span className="text-muted">{formatMoney(p.unit_price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Button variant="secondary" onClick={() => addManual("service")}>
          Add service
        </Button>
        <Button variant="secondary" onClick={() => addManual("custom")}>
          Add custom
        </Button>
      </div>
    </section>
  );
}
