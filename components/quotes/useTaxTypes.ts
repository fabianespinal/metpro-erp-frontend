"use client";

import { useEffect, useState } from "react";
import { listTaxTypes, type TaxType } from "@/lib/quotingApi";

/**
 * Active tax types from the backend. While loading, or if the call fails, the list is empty:
 * screens then show no selector and the backend applies the document's own type (or the default
 * for a new quote), so a failed call never changes a rate.
 */
export function useTaxTypes() {
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listTaxTypes()
      .then((rows) => {
        if (!cancelled) setTaxTypes(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setTaxTypes([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { taxTypes, loaded };
}
