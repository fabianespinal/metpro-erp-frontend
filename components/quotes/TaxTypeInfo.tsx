"use client";

import { es } from "@/lib/i18n/es";

interface Props {
  /** Label decided by the backend (preview or stored snapshot). Empty until known. */
  label?: string | null;
}

/**
 * Tax type, informational and read-only. The backend decides it from the selected indirect charges
 * (resolve_tax_type). The browser only displays the label it is given.
 */
export default function TaxTypeInfo({ label }: Props) {
  if (!label) return null;
  return (
    <div className="mb-4">
      <span className="mb-2 block text-sm font-medium">{es.cot.tipoImpuesto}</span>
      <div className="w-full rounded border bg-canvas p-2 text-sm" data-testid="tax-type-info">
        {label}
      </div>
    </div>
  );
}
