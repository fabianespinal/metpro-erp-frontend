"use client";

import { useEffect, useState } from "react";
import { previewQuoteTotals, type IncludedCharges, type TotalsPreview } from "@/lib/quotingApi";
import { toPreviewInput, type TakeOffLine } from "@/lib/takeOffLines";

/**
 * Debounced totals from the backend preview endpoint. The browser displays the
 * result and does no tax or charge math.
 */
export function useTotalsPreview(lines: TakeOffLine[], charges: IncludedCharges) {
  const [totals, setTotals] = useState<TotalsPreview | null>(null);
  const [totalsError, setTotalsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      previewQuoteTotals(toPreviewInput(lines, charges))
        .then((t) => {
          if (!cancelled) {
            setTotals(t);
            setTotalsError(null);
          }
        })
        .catch((err: Error) => {
          if (!cancelled) setTotalsError(err.message || "Could not update totals.");
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [lines, charges]);

  return { totals, totalsError };
}
