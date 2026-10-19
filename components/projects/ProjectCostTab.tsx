"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { es } from "@/lib/i18n/es";
import { money } from "@/lib/money";
import { dt } from "@/components/ui/data-table";

const t = es.cst;

interface CostLine {
  product_id: number | null;
  product_name: string;
  category: string | null;
  quantity: number;
  unit_cost: number | null;
  line_cost: number | null;
  costed: boolean;
  reason: "sin_producto" | "sin_costo" | null;
}

interface ProjectCost {
  has_quote: boolean;
  estimate: { lines: CostLine[]; lines_total: number; lines_costed: number; complete: boolean; estimated_margin_pct: number | null } | null;
  estimated_cost: number;
  estimated_margin: number | null;
  expenses_total: number;
  billed_net: number;
  actual_margin: number | null;
  variance: number;
  variance_pct: number | null;
  margin_accuracy_pct: number | null;
}

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v.toFixed(1)}%`);

function Card({ label, value, help, tone }: { label: string; value: string; help?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-card" title={help}>
      <div className="text-sm text-muted">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums ${tone ?? "text-ink"}`}>{value}</div>
      {help ? <div className="mt-1 text-xs text-muted">{help}</div> : null}
    </div>
  );
}

/** "Costo estimado" tab: estimated cost vs actual expenses, variance, margin accuracy, line costs. */
export default function ProjectCostTab({ projectId }: { projectId: number | string }) {
  const [data, setData] = useState<ProjectCost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (api(`/projects/${projectId}/cost-estimate`) as Promise<ProjectCost>)
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setError(t.errorCargar + e.message));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (error)
    return (
      <p role="alert" className="mb-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {error}
      </p>
    );
  if (!data) return <p className="mb-6 text-sm text-muted">{es.comun.cargando}</p>;
  if (!data.has_quote || !data.estimate)
    return <p className="mb-6 rounded-lg border border-dashed border-line bg-canvas p-4 text-sm text-muted">{t.sinCotizacion}</p>;

  const e = data.estimate;
  return (
    <section className="mb-6 space-y-4">
      <p className="text-xs text-muted" title={t.aviso}>ⓘ {t.aviso}. {t.cobertura(e.lines_costed, e.lines_total)}.</p>
      {!e.complete && <p className="text-xs text-amber-700">{t.coberturaIncompleta}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card label={t.tabCostos} value={money(data.estimated_cost)} help={`${t.gastosReales}: ${money(data.expenses_total)}`} />
        <Card
          label={t.variacion}
          value={`${money(data.variance)} (${pct(data.variance_pct)})`}
          help={t.variacionAyuda}
          tone={data.variance < 0 ? "text-red-600" : "text-ink"}
        />
        <Card label={t.precisionMargen} value={pct(data.margin_accuracy_pct)} help={t.precisionAyuda} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card
          label={t.margenEstimado}
          value={data.estimated_margin === null ? "—" : `${money(data.estimated_margin)} (${pct(e.estimated_margin_pct)})`}
        />
        <Card label={t.margenReal} value={data.actual_margin === null ? "—" : money(data.actual_margin)} />
      </div>

      <div className={`${dt.wrap} overflow-x-auto`}>
        <table className={dt.table}>
          <thead className={dt.thead}>
            <tr>
              <th className={dt.th}>{t.colProducto}</th>
              <th className={dt.thRight}>{t.colCantidad}</th>
              <th className={dt.thRight}>{t.colCostoUnit}</th>
              <th className={dt.thRight}>{t.colCostoLinea}</th>
            </tr>
          </thead>
          <tbody className={dt.tbody}>
            {e.lines.map((l, i) => (
              <tr key={i} className={dt.tr}>
                <td className={dt.td}>
                  {l.product_name}
                  {l.category ? <div className="text-xs text-muted">{l.category}</div> : null}
                </td>
                <td className={dt.tdRight}>{l.quantity}</td>
                <td className={dt.tdRight}>{l.unit_cost === null ? "—" : money(l.unit_cost)}</td>
                <td className={dt.tdRight}>
                  {l.costed ? (
                    money(l.line_cost)
                  ) : (
                    <span className="text-xs text-amber-700">{l.reason === "sin_producto" ? t.motivoSinProducto : t.motivoSinCosto}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
