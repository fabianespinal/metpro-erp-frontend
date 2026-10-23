/**
 * Pure helpers for the estimator screen (I4). No React, no money math.
 * The backend owns every calculation. These only validate form text and shape requests.
 */
import type { EstimateInputsPayload, EstimateOverride, EstimatePreview, ProfileRole } from "@/lib/estimatorApi";

export const NUMBER_FIELDS = [
  "ancho",
  "largo",
  "altura_laterales",
  "altura_techado_lateral",
  "distancia_ejes",
  "columnas_frontales",
] as const;
export type NumberField = (typeof NUMBER_FIELDS)[number];

export type EstimateForm = Record<NumberField, string> & { perfiles: Record<ProfileRole, string> };

/** Workbook default case. Profiles are the workbook defaults (designations as stored). */
export const DEFAULT_FORM: EstimateForm = {
  ancho: "18",
  largo: "45",
  altura_laterales: "9",
  altura_techado_lateral: "5",
  distancia_ejes: "7.5",
  columnas_frontales: "6",
  perfiles: { columnas: "W12x40", frontales: "W8x31", tijerillas: "W14x22", frenado: "W10x12" },
};

export function parseNumber(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** First problem in Spanish, or null. Mirrors backend guards; the backend still decides. */
export function formProblem(form: EstimateForm): string | null {
  for (const f of NUMBER_FIELDS) {
    const n = parseNumber(form[f]);
    if (n === null) return "Complete todos los números con valores válidos.";
    if (f === "columnas_frontales" ? n < 0 : n <= 0) return "Las medidas deben ser mayores que cero.";
  }
  const largo = parseNumber(form.largo) as number;
  const ejes = parseNumber(form.distancia_ejes) as number;
  const ratio = largo / ejes;
  if (Math.abs(ratio - Math.round(ratio)) > 1e-9) {
    return "El largo debe ser múltiplo de la distancia entre ejes.";
  }
  return null;
}

export interface OverrideDraft {
  unit_price: string;
  quantity: string;
  reason: string;
}
export type OverrideDrafts = Record<number, OverrideDraft>;

/** A draft with a price or quantity needs a reason. Returns row of first violation or null. */
export function overrideProblemRow(drafts: OverrideDrafts): number | null {
  for (const [row, d] of Object.entries(drafts)) {
    const hasValue = d.unit_price.trim() !== "" || d.quantity.trim() !== "";
    if (!hasValue) continue;
    if (!d.reason.trim()) return Number(row);
    if (d.unit_price.trim() !== "" && (parseNumber(d.unit_price) ?? -1) < 0) return Number(row);
    if (d.quantity.trim() !== "" && (parseNumber(d.quantity) ?? -1) < 0) return Number(row);
  }
  return null;
}

export function overridesFromDrafts(drafts: OverrideDrafts): EstimateOverride[] {
  const out: EstimateOverride[] = [];
  for (const [row, d] of Object.entries(drafts)) {
    const price = d.unit_price.trim() === "" ? null : parseNumber(d.unit_price);
    const qty = d.quantity.trim() === "" ? null : parseNumber(d.quantity);
    if (price === null && qty === null) continue;
    const o: EstimateOverride = { row: Number(row), reason: d.reason.trim() };
    if (price !== null) o.unit_price = price;
    if (qty !== null) o.quantity = qty;
    out.push(o);
  }
  return out.sort((a, b) => a.row - b.row);
}

/** Request body, or null while the form has a problem. */
export function buildRequest(form: EstimateForm, drafts: OverrideDrafts): EstimateInputsPayload | null {
  if (formProblem(form) || overrideProblemRow(drafts) !== null) return null;
  const n = (f: NumberField) => parseNumber(form[f]) as number;
  return {
    ancho: n("ancho"),
    largo: n("largo"),
    altura_laterales: n("altura_laterales"),
    altura_techado_lateral: n("altura_techado_lateral"),
    distancia_ejes: n("distancia_ejes"),
    columnas_frontales: n("columnas_frontales"),
    perfiles: { ...form.perfiles },
    overrides: overridesFromDrafts(drafts),
  };
}

// ---- Parity panel (admin). Typed workbook values stay in the browser. ----

export interface ParityRow {
  cell: string;
  estimator: number;
  workbook: number;
  difference: number;
  matches: boolean;
}

/** Cells comparable from a preview: intermediates (E42, C93 ...), line totals F<row>, subtotal F122. */
export function parityCells(preview: EstimatePreview): Record<string, number> {
  const cells: Record<string, number> = { ...preview.intermediates };
  for (const ln of preview.lines) cells[`F${ln.row}`] = ln.total;
  cells["F122"] = preview.subtotal_unrounded;
  return cells;
}

/** Same tolerance as the backend parity endpoint: max(1e-6, 1e-9 * |value|). */
export function compareParity(preview: EstimatePreview, typed: Record<string, string>): { rows: ParityRow[]; unknown: string[] } {
  const mine = parityCells(preview);
  const rows: ParityRow[] = [];
  const unknown: string[] = [];
  for (const [rawCell, text] of Object.entries(typed)) {
    const cell = rawCell.trim().toUpperCase();
    if (!cell || text.trim() === "") continue;
    const value = parseNumber(text);
    if (value === null) continue;
    if (!(cell in mine)) {
      unknown.push(cell);
      continue;
    }
    const difference = mine[cell] - value;
    rows.push({
      cell,
      estimator: mine[cell],
      workbook: value,
      difference,
      matches: Math.abs(difference) <= Math.max(1e-6, Math.abs(value) * 1e-9),
    });
  }
  return { rows, unknown };
}

export function warningText(w: EstimatePreview["warnings"][number]): string {
  return w.defect ? `${w.message_es} (${w.defect})` : w.message_es;
}

/** Edit-screen rule: money is read-only for non-admins on estimate quotes. */
export function isEstimateQuote(quote: { quote_type?: string | null } | null | undefined): boolean {
  return quote?.quote_type === "engineering_estimate";
}
export function moneyLocked(quote: { quote_type?: string | null } | null | undefined, isAdmin: boolean): boolean {
  return isEstimateQuote(quote) && !isAdmin;
}
export function needsEditReason(quote: { quote_type?: string | null } | null | undefined, isAdmin: boolean): boolean {
  return isEstimateQuote(quote) && isAdmin;
}

/** True when items or charges differ between two save snapshots (JSON with items and included_charges). */
export function moneyChanged(savedSnapshot: string, currentSnapshot: string): boolean {
  try {
    const a = JSON.parse(savedSnapshot);
    const b = JSON.parse(currentSnapshot);
    return JSON.stringify([a.items, a.included_charges]) !== JSON.stringify([b.items, b.included_charges]);
  } catch {
    return true; // fail closed: treat as a money change
  }
}
