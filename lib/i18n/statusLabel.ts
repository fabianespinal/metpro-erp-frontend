import { es } from "@/lib/i18n/es";

/**
 * Gender-aware status labels. Rendering only: stored status values stay in English
 * and the dictionary entries in es.ts are not changed.
 *
 * Quotes and invoices are feminine (la cotización, la factura).
 * Projects and payments are masculine (el proyecto, el pago).
 */
export type StatusGender = "m" | "f";

// [masculine, feminine]. Keys are lowercase English status values.
const FORMS: Record<string, [string, string]> = {
  draft: ["Borrador", "Borrador"],
  final: ["Final", "Final"],
  sent: ["Enviado", "Enviada"],
  approved: ["Aprobado", "Aprobada"],
  rejected: ["Rechazado", "Rechazada"],
  invoiced: ["Facturado", "Facturada"],
  pending: ["Pendiente", "Pendiente"],
  paid: ["Pagado", "Pagada"],
  cancelled: ["Cancelado", "Cancelada"],
  canceled: ["Cancelado", "Cancelada"],
  overdue: ["Vencido", "Vencida"],
  partial: ["Pago parcial", "Pago parcial"],
  active: ["Activo", "Activa"],
  completed: ["Completado", "Completada"],
  planning: ["Planificación", "Planificación"],
  in_progress: ["En progreso", "En progreso"],
  on_hold: ["En pausa", "En pausa"],
};

export function getStatusLabel(status: string | null | undefined, gender: StatusGender = "m"): string {
  const key = String(status ?? "").trim().toLowerCase();
  const forms = FORMS[key];
  if (forms) return gender === "f" ? forms[1] : forms[0];
  return es.estados[key] || (status ? String(status) : es.estados.unknown);
}
