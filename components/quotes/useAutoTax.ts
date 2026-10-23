"use client";

import { useEffect, useMemo, useState } from "react";
import { getQuoteOptions, type IncludedCharges, type TaxType } from "@/lib/quotingApi";
import { taxCodeForCharges } from "@/lib/taxRule";

/**
 * Automatic tax. When the backend switch is on, the tax type follows the charges and the screen shows it
 * read-only. Display only: the backend decides the stored tax on save. Switch off or options call failed:
 * `auto` is false and screens behave exactly as before.
 */
export function useAutoTax(charges: IncludedCharges | Record<string, unknown> | null | undefined, taxTypes: TaxType[]) {
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getQuoteOptions().then((o) => {
      if (!cancelled) setAuto(o.tax_from_charges_enabled === true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const code = auto ? taxCodeForCharges(charges as Record<string, unknown>) : "";
  const type = useMemo(
    () => (auto ? taxTypes.find((t) => (code ? t.code === code : t.is_default)) ?? null : null),
    [auto, code, taxTypes],
  );
  return { auto, code, type };
}
