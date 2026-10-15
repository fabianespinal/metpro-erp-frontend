"use client";

/**
 * Quoting v1 API layer. Types mirror the backend models in
 * template_packs/models.py and quotes/models.py (feat/quoting-v1-phase1).
 *
 * Money values are plain numbers from the backend. Totals are computed by the
 * backend (compute_totals, ITBIS 18%). The browser does not recompute them.
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
  unit_price: number | null;
  default_qty: number;
  optional: boolean;
  sort_order: number;
}

export interface TemplatePackCategory {
  id: number;
  name: string;
  sort_order: number;
  items: TemplatePackItem[];
}

export interface TemplatePack {
  id: number;
  name: string;
  description: string | null;
  categories: TemplatePackCategory[];
  created_at: string | null;
  updated_at: string | null;
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
}

export interface DraftQuoteInput {
  client_id: number;
  contact_id: number;
  project_name?: string | null;
  notes?: string | null;
  payment_terms?: string | null;
  valid_until?: string | null; // YYYY-MM-DD
  items: QuoteLineInput[];
  included_charges: IncludedCharges;
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
}

export interface QuoteOut {
  quote_id: string;
  client_id: number | null;
  contact_id: number | null;
  project_name: string | null;
  notes: string | null;
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
// Error helpers
// ------------------------------------------------------

/** True when the error carries the given backend code, e.g. "QUOTE_EMPTY". */
export function hasErrorCode(err: unknown, code: string): boolean {
  return !!err && typeof err === "object" && (err as QuotingApiError).code === code;
}
