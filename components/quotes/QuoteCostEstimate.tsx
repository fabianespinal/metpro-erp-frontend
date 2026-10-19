"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { es } from "@/lib/i18n/es";
import { money } from "@/lib/money";

const t = es.cst;

export interface CostEstimate {
  subtotal: number;
  estimated_cost: number;
  estimated_margin: number;
  estimated_margin_pct: number | null;
  lines_total: number;
  lines_costed: number;
  complete: boolean;
}

type Props =
  | { quoteId: string; items?: undefined; charges?: undefined; className?: string }
  | { quoteId?: undefined; items: unknown[]; charges: unknown; className?: string };

/**
 * Estimated cost and margin (Product Cost module). Internal, display only:
 * "Estimado, no afecta el total de la cotización". Saved quote by id, or live lines (debounced).
 */
export default function QuoteCostEstimate(props: Props) {
  const [data, setData] = useState<CostEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = props.quoteId ?? JSON.stringify([props.items, props.charges]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(
      () => {
        const req = props.quoteId
          ? api(`/quotes/${props.quoteId}/cost-estimate`)
          : api("/quotes/cost-estimate/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: props.items, included_charges: props.charges }),
            });
        (req as Promise<CostEstimate>)
          .then((d) => {
            if (!cancelled) {
              setData(d);
              setError(null);
            }
          })
          .catch((e: Error) => !cancelled && setError(e.message));
      },
      props.quoteId ? 0 : 400
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <section
      className={`rounded-lg border border-dashed border-line bg-canvas p-4 text-sm ${props.className ?? ""}`}
      title={t.aviso}
      aria-label={t.costoEstimado}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-ink">{t.costoEstimado}</h2>
        <span className="cursor-help text-xs text-muted" title={t.aviso} aria-label={t.aviso}>
          ⓘ {t.aviso}
        </span>
      </div>
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : !data ? (
        <p className="text-xs text-muted">{es.comun.cargando}</p>
      ) : data.lines_total === 0 ? (
        <p className="text-xs text-muted">{t.sinLineas}</p>
      ) : (
        <>
          <dl className="space-y-1 tabular-nums">
            <div className="flex justify-between">
              <dt className="text-muted">{t.subtotalSinItbis}</dt>
              <dd>{money(data.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t.costoEstimado}</dt>
              <dd>{money(data.estimated_cost)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>{t.margenEstimado}</dt>
              <dd className={data.estimated_margin < 0 ? "text-red-600" : "text-ink"}>{money(data.estimated_margin)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t.margenEstimadoPct}</dt>
              <dd>{data.estimated_margin_pct === null ? "—" : `${data.estimated_margin_pct.toFixed(1)}%`}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted">{t.cobertura(data.lines_costed, data.lines_total)}</p>
          {!data.complete && <p className="mt-1 text-xs text-amber-700">{t.coberturaIncompleta}</p>}
        </>
      )}
    </section>
  );
}
