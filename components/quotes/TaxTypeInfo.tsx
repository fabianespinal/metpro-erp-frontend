"use client";

import { es } from "@/lib/i18n/es";

/** Read-only tax line shown when the tax follows the charges automatically. */
export default function TaxTypeInfo({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <div className="mb-4 text-sm" data-testid="tax-auto-info">
      <span className="font-medium">{es.cot.tipoImpuesto}: </span>
      <span>{label}</span>
      <p className="text-xs text-muted">{es.cot.impuestoAutomatico}</p>
    </div>
  );
}
