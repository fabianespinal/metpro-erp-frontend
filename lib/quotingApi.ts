"use client";

/**
 * Quoting v1 API layer. Types mirror the backend models in
 * template_packs/models.py and quotes/models.py (feat/quoting-v1-phase1).
 *
 * Money values are plain numbers from the backend. Totals are computed by the
 * backend (compute_totals, with the tax type's rate). The browser does not recompute them.
 */

import { api } from "@/lib/api";

/** Typed wrapper around the envelope-unwrapping api() helper. */
async function call<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return (await api(endpoint, options)) as T;
}

// ------------------------------------------------------
// Types
// ------------------------------------------------------

export type ItemType = "product" | "service" | "custom";
export type DiscountType = "none" | "percentage" | "fixed";

export interface TemplatePackSummary {
  id: number;
  name: string;
  description: string | null;
  category_count: number;
  item_count: number;
  updated_at: string | null;
}

export interface TemplatePackItem {
  id: number;
  product_id: number;
  product_name: string | null;
  /** Effective price for quoting: pack_price_override when set, else catalog_price. */
  unit_price: number | null;
  catalog_price?: number | null;
  pack_price_override?: number | null;
  default_qty: number;
  optional: boolean;
  sort_order: number;
  print_on_pdf?: boolean;
}

export interface TemplatePackCategory {
  id: number;
  name: string;
  sort_order: number;
  items: TemplatePackItem[];
}

/** Pack-level charge. Copied into the quote's dynamic_charges when a quote starts from the pack. */
export interface TemplatePackCharge {
  id: number;
  name: string;
  type: "percentage";
  value: number;
  enabled_by_default: boolean;
  sort_order: number;
}

export const MAX_PACK_CHARGES = 3;

export interface TemplatePack {
  id: number;
  name: string;
  description: string | null;
  categories: TemplatePackCategory[];
  /** Optional: older backends omit it. */
  charges?: TemplatePackCharge[];
  created_at: string | null;
  updated_at: string | null;
}

/** User-defined charge (max 3 per quote), percent of items after discount. */
export interface DynamicCharge {
  id?: string;
  name: string;
  enabled: boolean;
  percentage: number;
}

export interface IncludedCharges {
  supervision: boolean;
  supervision_percentage: number;
  admin: boolean;
  admin_percentage: number;
  insurance: boolean;
  insurance_percentage: number;
  transport: boolean;
  transport_percentage: number;
  contingency: boolean;
  contingency_percentage: number;
  /** Optional: legacy quotes omit it. */
  dynamic_charges?: DynamicCharge[];
}

export interface QuoteLineInput {
  product_id?: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_type: DiscountType;
  discount_value: number;
  item_type: ItemType;
  description?: string | null;
  category?: string | null;
  /** Medidas. Omit = the backend takes the product's unit. "" = none. */
  unit_of_measure?: string | null;
  /** A3. false = counted in totals, never printed on customer documents. Always send it so a save never un-hides a line. */
  print_on_pdf?: boolean;
}

/** A5/A1: tax types come from the backend (tax_types). Rates and labels are never hardcoded in the UI. */
export interface TaxType {
  code: string;
  label: string;
  /** Fraction: 0.18 = 18%. */
  rate: number;
  active: boolean;
  is_default: boolean;
  sort_order: number;
}

/** A3: is the "no imprimir" control switched on? Off (or a failed call) hides the control; hidden lines stay hidden. */
/** Phase B switches. Both false while loading or on any failure, so a failed call only hides the new options. */
export interface QuoteOptions {
  blank_quotes_enabled: boolean;
  duplicate_change_client_enabled: boolean;
  /** Tax follows the charges automatically; screens show it read-only. */
  tax_from_charges_enabled: boolean;
}

export async function getQuoteOptions(): Promise<QuoteOptions> {
  try {
    const d = await call<Partial<QuoteOptions>>("/quotes/options");
    return { blank_quotes_enabled: d?.blank_quotes_enabled === true, duplicate_change_client_enabled: d?.duplicate_change_client_enabled === true, tax_from_charges_enabled: d?.tax_from_charges_enabled === true };
  } catch {
    return { blank_quotes_enabled: false, duplicate_change_client_enabled: false, tax_from_charges_enabled: false };
  }
}

export async function getPrintControlsEnabled(): Promise<boolean> {
  try {
    const d = await call<{ print_controls_enabled?: boolean }>("/quotes/print-options");
    return d?.print_controls_enabled === true;
  } catch {
    return false;
  }
}

export async function listTaxTypes(): Promise<TaxType[]> {
  return call<TaxType[]>("/tax-types");
}

export interface DraftQuoteInput {
  /** Omit for the default type. */
  tax_type_code?: string | null;
  client_id: number;
  contact_id: number;
  project_name?: string | null;
  notes?: string | null;
  payment_terms?: string | null;
  valid_until?: string | null; // YYYY-MM-DD
  items: QuoteLineInput[];
  included_charges: IncludedCharges;
  /** false = PDFs show no item table. Totals unchanged. Omit = on. */
  print_items?: boolean;
}

export interface QuoteItemOut {
  id: number;
  quote_id: string;
  product_id: number | null;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  discount_type: DiscountType | null;
  discount_value: number | null;
  item_type?: ItemType;
  description?: string | null;
  category?: string | null;
  unit_of_measure?: string | null;
  print_on_pdf?: boolean;
}

export interface QuoteOut {
  quote_id: string;
  client_id: number | null;
  contact_id: number | null;
  project_name: string | null;
  notes: string | null;
  /** null or "standard" = normal quote. "engineering_estimate" = locked money (I4). */
  quote_type?: string | null;
  /** false = PDFs show no item table. Absent on older backends = true. */
  print_items?: boolean;
  tax_type_code?: string | null;
  tax_label?: string | null;
  tax_rate?: number | null;
  status: "Draft" | "Final" | "Sent" | "Approved" | "Rejected" | "Invoiced";
  included_charges: unknown;
  total_amount: number | null;
  subtotal?: number | null;
  discount_total?: number | null;
  tax_amount?: number | null;
  grand_total?: number | null;
  payment_terms: string | null;
  valid_until: string | null;
  finalized_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
  items: QuoteItemOut[];
}

/** Error shape thrown by lib/api.ts. `code` is the backend error code. */
export interface QuotingApiError extends Error {
  status?: number;
  code?: string;
}

// ------------------------------------------------------
// Defaults
// ------------------------------------------------------

/** Matches backend IncludedCharges defaults. All charges on, standard percentages. */
export const DEFAULT_INCLUDED_CHARGES: IncludedCharges = {
  supervision: true,
  supervision_percentage: 10,
  admin: true,
  admin_percentage: 4,
  insurance: true,
  insurance_percentage: 1,
  transport: true,
  transport_percentage: 3,
  contingency: true,
  contingency_percentage: 3,
};

// ------------------------------------------------------
// Template packs (read: any authenticated user)
// ------------------------------------------------------

export async function listTemplatePacks(): Promise<TemplatePackSummary[]> {
  return call<TemplatePackSummary[]>("/template-packs/");
}

export async function getTemplatePack(packId: number): Promise<TemplatePack> {
  return call<TemplatePack>(`/template-packs/${packId}`);
}

// ------------------------------------------------------
// Quotes: draft, finalize, duplicate
// ------------------------------------------------------

export async function createDraftQuote(input: DraftQuoteInput): Promise<QuoteOut> {
  return call<QuoteOut>("/quotes/draft", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getQuote(quoteId: string): Promise<QuoteOut> {
  return call<QuoteOut>(`/quotes/${quoteId}`);
}

export interface DraftUpdateInput {
  /** Only sent when the user picked a type. Draft only. */
  tax_type_code?: string | null;
  project_name?: string | null;
  notes?: string | null;
  payment_terms?: string | null;
  items: QuoteLineInput[];
  included_charges: IncludedCharges;
  print_items?: boolean;
  /** Estimate quotes, admin, when money changes. Audited. */
  edit_reason?: string;
}

/** PUT /quotes/{id}. Draft only. The backend returns 400 QUOTE_FINALIZED or QUOTE_NOT_DRAFT otherwise. */
export async function updateDraftQuote(quoteId: string, input: DraftUpdateInput): Promise<QuoteOut> {
  return call<QuoteOut>(`/quotes/${quoteId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function finalizeQuote(quoteId: string): Promise<QuoteOut> {
  return call<QuoteOut>(`/quotes/${quoteId}/finalize`, {
    method: "POST",
  });
}

export async function duplicateQuote(quoteId: string): Promise<QuoteOut> {
  return call<QuoteOut>(`/quotes/${quoteId}/duplicate`, {
    method: "POST",
  });
}

// ------------------------------------------------------
// Totals preview (stateless; backend computes, browser displays)
// ------------------------------------------------------

export interface TotalsPreview {
  items_total: number;
  total_discounts: number;
  items_after_discount: number;
  supervision: number;
  admin: number;
  insurance: number;
  transport: number;
  contingency: number;
  subtotal: number;
  tax_rate: number;
  tax_type_code?: string;
  tax_label?: string;
  tax_amount: number;
  grand_total: number;
}

export interface TotalsPreviewInput {
  items: QuoteLineInput[];
  included_charges: IncludedCharges;
  /** Tax type to use. Estimate quotes and Draft quotes with a chosen type send it; others omit it (default tax). */
  tax_type_code?: string | null;
}

export async function previewQuoteTotals(input: TotalsPreviewInput): Promise<TotalsPreview> {
  return call<TotalsPreview>("/quotes/totals/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ------------------------------------------------------
// Error helpers
// ------------------------------------------------------

/** True when the error carries the given backend code, e.g. "QUOTE_EMPTY". */
export function hasErrorCode(err: unknown, code: string): boolean {
  return !!err && typeof err === "object" && (err as QuotingApiError).code === code;
}
