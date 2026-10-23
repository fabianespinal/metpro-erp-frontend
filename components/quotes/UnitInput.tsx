"use client";

import { UNIT_MAX_LENGTH, UNIT_SUGGESTIONS } from "@/lib/pdfOptions";

export const UNIT_LIST_ID = "unit-suggestions";

/** Free-text unit of measure with suggestions. Render once per screen next to the first input. */
export function UnitSuggestions() {
  return (
    <datalist id={UNIT_LIST_ID}>
      {UNIT_SUGGESTIONS.map((u) => (
        <option key={u} value={u} />
      ))}
    </datalist>
  );
}

export function UnitInput({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <>
      <input
        type="text"
        list={UNIT_LIST_ID}
        value={value}
        maxLength={UNIT_MAX_LENGTH}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        aria-label={label}
      />
      <UnitSuggestions />
    </>
  );
}
