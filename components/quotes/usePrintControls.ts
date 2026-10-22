"use client";

import { useEffect, useState } from "react";
import { getPrintControlsEnabled } from "@/lib/quotingApi";

/** A3: whether the "no imprimir" control is switched on. False while loading or if the call fails. */
export function usePrintControls(): boolean {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getPrintControlsEnabled().then((v) => {
      if (!cancelled) setEnabled(v);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return enabled;
}
