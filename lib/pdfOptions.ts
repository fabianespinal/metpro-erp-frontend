"use client";

/**
 * PDF update: which of the new PDF controls the backend has switched on (GET /quotes/pdf-options).
 * Fails closed: when the call fails every control stays hidden and the screens behave as before.
 */

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface PdfOptions {
  medidas_enabled: boolean;
  print_items_enabled: boolean;
  project_desc_enabled: boolean;
}

export const NO_PDF_OPTIONS: PdfOptions = {
  medidas_enabled: false,
  print_items_enabled: false,
  project_desc_enabled: false,
};

/** Suggestions only. The field is free text; there is no fixed list in code or in the database. */
export const UNIT_SUGGESTIONS = ["Unidad", "Ft", "M", "M2", "Ton", "Lb", "Set", "Pie", "Cola"] as const;

export const UNIT_MAX_LENGTH = 20;

let cached: Promise<PdfOptions> | null = null;

export function getPdfOptions(): Promise<PdfOptions> {
  if (!cached) {
    cached = (async () => {
      try {
        const r = (await api("/quotes/pdf-options")) as Partial<PdfOptions> | null;
        return {
          medidas_enabled: r?.medidas_enabled === true,
          print_items_enabled: r?.print_items_enabled === true,
          project_desc_enabled: r?.project_desc_enabled === true,
        };
      } catch {
        cached = null; // try again on the next screen
        return NO_PDF_OPTIONS;
      }
    })();
  }
  return cached;
}

export function usePdfOptions(): PdfOptions {
  const [opts, setOpts] = useState<PdfOptions>(NO_PDF_OPTIONS);
  useEffect(() => {
    let cancelled = false;
    getPdfOptions().then((o) => {
      if (!cancelled) setOpts(o);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return opts;
}
