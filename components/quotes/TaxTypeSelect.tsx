"use client";

import { es } from "@/lib/i18n/es";
import type { TaxType } from "@/lib/quotingApi";

interface Props {
  taxTypes: TaxType[];
  /** Selected code. Empty string = the default type. */
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

/**
 * Tax type picker. Renders nothing unless there is a real choice (two or more active types), so the
 * screens look exactly as before while only the default type is active.
 */
export default function TaxTypeSelect({ taxTypes, value, onChange, disabled }: Props) {
  if (taxTypes.length < 2) return null;
  const effective = value || taxTypes.find((t) => t.is_default)?.code || taxTypes[0].code;
  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium" htmlFor="tax-type-select">
        {es.cot.tipoImpuesto}
      </label>
      <select
        id="tax-type-select"
        value={effective}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border p-2 disabled:opacity-60"
      >
        {taxTypes.map((t) => (
          <option key={t.code} value={t.code}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
