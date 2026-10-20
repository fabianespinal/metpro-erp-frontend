"use client";

import { es } from "@/lib/i18n/es";

/** "Imprimir sello de la empresa". Parents render it only when a seal exists. */
export default function SealCheckbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {es.sello.imprimir}
    </label>
  );
}
