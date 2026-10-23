/**
 * Engineering Estimate API client (I4). Admin only. Switch off = 404 ESTIMATOR_DISABLED.
 * The browser does no estimate math. Everything shown comes from the backend.
 */
import { api } from "@/lib/api";
import type { TotalsPreview } from "@/lib/quotingApi";

async function call<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return (await api(endpoint, options)) as T;
}

export type ProfileRole = "columnas" | "frontales" | "tijerillas" | "frenado";

export interface EstimateProfile {
  designation: string;
  display_designation: string | null;
  family: string | null;
  depth_in: number;
  lb_per_ft: number;
}

export interface EstimateOverride {
  row: number;
  unit_price?: number;
  quantity?: number;
  reason: string;
}

export interface EstimateInputsPayload {
  ancho: number;
  largo: number;
  altura_laterales: number;
  altura_techado_lateral: number;
  distancia_ejes: number;
  columnas_frontales: number;
  perfiles: Record<ProfileRole, string>;
  overrides: EstimateOverride[];
}

export interface GeneratePayload extends EstimateInputsPayload {
  idempotency_key: string;
  client_id: number;
  contact_id: number;
  project_name?: string | null;
  notes?: string | null;
}

export interface EstimateLine {
  row: number;
  section: string;
  description: string;
  unit: string;
  quantity: number | null;
  quote_quantity: number;
  unit_price: number;
  total: number;
  quote_total: number;
  role: string | null;
}

export interface EstimateWarning {
  code: string;
  message_es: string;
  defect?: string;
}

export interface EstimatePreview {
  version: { id: number; version: string; rule_revision: number };
  lines: EstimateLine[];
  subtotal_unrounded: number;
  pounds_by_role: Record<string, number>;
  total_pounds_workbook_e60: number;
  intermediates: Record<string, number>;
  warnings: EstimateWarning[];
  overrides: Array<{ row: number; field: string; old: number | null; new: number; reason: string }>;
  totals_preview: TotalsPreview;
}

export interface GenerateResult {
  run_id: number;
  quote_id: string;
  quote_number: string | null;
  grand_total: number;
  already_generated: boolean;
  warnings: unknown[];
}

export async function getEstimatorEnabled(): Promise<boolean> {
  try {
    const r = await call<{ enabled?: boolean }>("/estimator/enabled");
    return r?.enabled === true;
  } catch {
    return false; // fail closed: no button
  }
}

export const listEstimateProfiles = () => call<EstimateProfile[]>("/estimator/profiles");

export const calculateEstimate = (p: EstimateInputsPayload) =>
  call<EstimatePreview>("/estimator/calculate", { method: "POST", body: JSON.stringify(p) });

export const generateEstimate = (p: GeneratePayload) =>
  call<GenerateResult>("/estimator/generate", { method: "POST", body: JSON.stringify(p) });

/** Spanish text for stable backend codes. Falls back to the server message. */
export const ESTIMATOR_ERRORS: Record<string, string> = {
  ESTIMATOR_DISABLED: "El estimador de ingeniería no está activado.",
  ESTIMATOR_NO_ACTIVE_VERSION: "No hay una versión activa del estimador.",
  ESTIMATOR_VERSION_INCOMPATIBLE: "La versión activa del estimador no es compatible con el sistema.",
  FRAMES_NOT_WHOLE: "El largo debe ser múltiplo de la distancia entre ejes (el número de pórticos debe ser entero).",
  INPUT_NOT_NUMBER: "Revise los números: hay un valor inválido.",
  INPUT_NOT_POSITIVE: "Las medidas deben ser mayores que cero.",
  INPUT_NEGATIVE: "La cantidad de columnas frontales no puede ser negativa.",
  PROFILE_NOT_FOUND: "El perfil de acero elegido no existe en la versión activa.",
  OVERRIDE_REASON_REQUIRED: "Todo cambio de precio o cantidad necesita un motivo.",
  OVERRIDE_UNKNOWN_LINE: "Un cambio apunta a una línea que no existe.",
  OVERRIDE_DUPLICATE_LINE: "Hay dos cambios para la misma línea.",
  OVERRIDE_EMPTY: "Un cambio no tiene precio ni cantidad.",
  IDEMPOTENCY_KEY_FOREIGN: "Esa clave ya fue usada por otro usuario. Recargue la página.",
  ESTIMATE_CONFLICT: "Conflicto al guardar el estimado. Intente de nuevo.",
};

export function estimatorErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string } | null;
  if (e?.code && ESTIMATOR_ERRORS[e.code]) return ESTIMATOR_ERRORS[e.code];
  return e?.message || "No se pudo completar la operación.";
}
