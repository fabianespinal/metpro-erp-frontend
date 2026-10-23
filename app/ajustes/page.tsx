"use client";

import Link from "next/link";
import type { Route } from "next";
import { es } from "@/lib/i18n/es";
import { useCurrentRole } from "@/lib/currentRole";
import { PageHeader } from "@/components/ui/page-header";
import { ajustesItems } from "@/lib/ajustesItems";

export default function AjustesPage() {
  const { isAdmin, loading } = useCurrentRole();
  if (loading) return <p className="p-6 text-sm text-muted">{es.comun.cargando}</p>;
  if (!isAdmin) {
    return (
      <div>
        <h1 className="sr-only">{es.ajustes.titulo}</h1>
        <p role="alert" className="m-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {es.ajustes.soloAdmin}
        </p>
      </div>
    );
  }
  return (
    <div className="text-ink">
      <PageHeader
        title={es.ajustes.titulo}
        subtitle={es.ajustes.subtitulo}
        actions={
          <Link href={"/dashboard" as Route} className="text-sm text-accent hover:underline">
            {es.ajustes.volver}
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ajustesItems.map((item) => (
          <Link
            key={item.href}
            href={item.href as Route}
            className="cursor-pointer rounded-xl border border-line bg-surface p-6 shadow-card transition-colors duration-200 hover:border-accent"
          >
            <div className="flex items-start gap-4">
              <div className="text-accent">{item.icon}</div>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-ink">{item.name}</h3>
                <p className="text-sm text-muted">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
