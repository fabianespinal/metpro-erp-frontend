"use client";

import { useEffect, useState } from "react";
import { previewQuoteTotals, type IncludedCharges } from "@/lib/quotingApi";

export interface TaxInfo {
  rate: number;
  label: string;
}

/**
 * Tax type for the selected indirect charges, decided by the backend (resolve_tax_type).
 * The browser sends the charges and displays the answer. Null until known or if the call fails;
 * callers then fall back to the stored snapshot, and the backend decides again on save.
 */
export function useTaxPreview(charges: IncludedCharges | null): TaxInfo | null {
  const [info, setInfo] = useState<TaxInfo | null>(null);

  useEffect(() => {
    if (!charges) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      previewQuoteTotals({ items: [], included_charges: charges })
        .then((t) => {
          if (!cancelled && t.tax_label) setInfo({ rate: Number(t.tax_rate), label: t.tax_label });
        })
        .catch(() => {
          if (!cancelled) setInfo(null);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [charges]);

  return info;
}
