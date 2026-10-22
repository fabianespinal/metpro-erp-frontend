import { es } from "@/lib/i18n/es";
/**
 * Take-off line model (quoting v1, module 6c). Pure functions, no React.
 *
 * A line is one row in the take-off table. Lines come from a template pack,
 * the product catalog, or are entered by hand (service, custom).
 * Only included lines are sent to the backend.
 */

import {
  DEFAULT_INCLUDED_CHARGES,
  type DiscountType,
  type DynamicCharge,
  type IncludedCharges,
  type ItemType,
  type QuoteItemOut,
  type QuoteLineInput,
  type TemplatePack,
  type TotalsPreviewInput,
} from "@/lib/quotingApi";

export type LineSource = "pack" | "product" | "manual";

export interface TakeOffLine {
  key: string;
  source: LineSource;
  category: string | null;
  include: boolean;
  product_id: number | null;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_type: DiscountType;
  discount_value: number;
  item_type: ItemType;
  /** Medidas. null = never set: the backend takes the product's unit on save. "" = none. */
  unit_of_measure: string | null;
  /** A3. false = counted in totals, hidden on customer documents. */
  print_on_pdf: boolean;
}

/**
 * Pack charges as quote dynamic charges. Percentage only (matches the backend
 * DynamicCharge model). Capped at 3, the quote maximum.
 */
export function dynamicChargesFromPack(pack: TemplatePack): DynamicCharge[] {
  return (pack.charges ?? []).slice(0, 3).map((c) => ({
    id: `pack_${c.id}`,
    name: c.name,
    enabled: c.enabled_by_default,
    percentage: Number(c.value),
  }));
}

/** Build lines from a template pack. Optional items start excluded. */
export function linesFromPack(pack: TemplatePack): TakeOffLine[] {
  const lines: TakeOffLine[] = [];
  for (const category of pack.categories) {
    for (const item of category.items) {
      lines.push({
        key: `pack-${item.id}`,
        source: "pack",
        category: category.name,
        include: !item.optional,
        product_id: item.product_id,
        name: item.product_name ?? es.cot.productoGenerico(item.product_id),
        description: "",
        quantity: item.default_qty,
        unit_price: item.unit_price ?? 0,
        discount_type: "none",
        discount_value: 0,
        item_type: "product",
        unit_of_measure: null,
        print_on_pdf: item.print_on_pdf !== false,
      });
    }
  }
  return lines;
}

/** Line total before tax and charges, after the line discount. */
export function lineTotal(line: TakeOffLine): number {
  const base = line.quantity * line.unit_price;
  let discount = 0;
  if (line.discount_type === "percentage") discount = base * (line.discount_value / 100);
  if (line.discount_type === "fixed") discount = line.discount_value;
  return Math.max(base - discount, 0);
}

/** Validation for one line. Returns the first problem, or null. */
export function lineProblem(line: TakeOffLine): string | null {
  if (!line.name.trim()) return es.cot.vNombre;
  if (!(line.quantity > 0)) return es.cot.vCantidad;
  if (line.unit_price < 0) return es.cot.vPrecio;
  if (line.discount_value < 0) return es.cot.vDescuento;
  if (line.discount_type === "percentage" && line.discount_value > 100) {
    return es.cot.vPorcentaje;
  }
  return null;
}

/**
 * Validation for a quote form row (product_name field, as the quote form uses).
 * Same rules as lineProblem. Returns the first problem, or null.
 */
export function itemProblem(item: {
  product_name?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  discount_type?: string | null;
  discount_value?: number | null;
}): string | null {
  const asLine = {
    name: item.product_name ?? "",
    quantity: Number(item.quantity ?? 0),
    unit_price: Number(item.unit_price ?? 0),
    discount_type: (item.discount_type ?? "none") as DiscountType,
    discount_value: Number(item.discount_value ?? 0),
  };
  return lineProblem(asLine as TakeOffLine);
}

/** Included lines only. Shape the backend expects for preview and save. */
export function toQuoteItems(lines: TakeOffLine[]): QuoteLineInput[] {
  return lines
    .filter((l) => l.include)
    .map((l) => ({
      product_id: l.product_id,
      product_name: l.name.trim(),
      quantity: l.quantity,
      unit_price: l.unit_price,
      discount_type: l.discount_type,
      discount_value: l.discount_value,
      item_type: l.item_type,
      description: l.description.trim() || null,
      category: l.category,
      ...(l.unit_of_measure === null ? {} : { unit_of_measure: l.unit_of_measure.trim() }),
      print_on_pdf: l.print_on_pdf,
    }));
}

export function toPreviewInput(
  lines: TakeOffLine[],
  charges: IncludedCharges,
  taxTypeCode?: string | null
): TotalsPreviewInput {
  return taxTypeCode
    ? { items: toQuoteItems(lines), included_charges: charges, tax_type_code: taxTypeCode }
    : { items: toQuoteItems(lines), included_charges: charges };
}

/** True when every included line passes validation and at least one is included. */
export function canSave(lines: TakeOffLine[]): boolean {
  const included = lines.filter((l) => l.include);
  return included.length > 0 && included.every((l) => lineProblem(l) === null);
}

export function newManualLine(itemType: ItemType): TakeOffLine {
  return {
    key: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: "manual",
    category: null,
    include: true,
    product_id: null,
    name: "",
    description: "",
    quantity: 1,
    unit_price: 0,
    discount_type: "none",
    discount_value: 0,
    item_type: itemType,
    unit_of_measure: "",
    print_on_pdf: true,
  };
}

export function newProductLine(product: { id: number; name: string; unit_price: number; unit_of_measure?: string | null }): TakeOffLine {
  return {
    key: `product-${product.id}-${Date.now()}`,
    source: "product",
    category: null,
    include: true,
    product_id: product.id,
    name: product.name,
    description: "",
    quantity: 1,
    unit_price: product.unit_price,
    discount_type: "none",
    discount_value: 0,
    item_type: "product",
    unit_of_measure: product.unit_of_measure ?? "",
    print_on_pdf: true,
  };
}

export function formatMoney(value: number | null | undefined): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Lines from a saved quote (editor load). Product rows keep their product_id. */
export function linesFromQuote(items: QuoteItemOut[]): TakeOffLine[] {
  return items.map((item) => ({
    key: `saved-${item.id}`,
    source: item.product_id !== null ? "product" : "manual",
    category: item.category ?? null,
    include: true,
    product_id: item.product_id,
    name: item.product_name ?? "",
    description: item.description ?? "",
    quantity: Number(item.quantity),
    unit_price: Number(item.unit_price),
    discount_type: item.discount_type ?? "none",
    discount_value: Number(item.discount_value ?? 0),
    item_type: item.item_type ?? "product",
    unit_of_measure: item.unit_of_measure ?? "",  // saved: null means none, so a save does not re-fill it
    print_on_pdf: item.print_on_pdf !== false,
  }));
}

/** included_charges arrives as stored text or an object. Fall back to defaults. */
export function parseIncludedCharges(raw: unknown): IncludedCharges {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = raw ? JSON.parse(raw) : {};
    } catch {
      value = {};
    }
  }
  const obj = (value && typeof value === "object" ? value : {}) as Partial<IncludedCharges>;
  return { ...DEFAULT_INCLUDED_CHARGES, ...obj };
}
