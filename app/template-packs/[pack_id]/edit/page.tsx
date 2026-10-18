"use client";

import { es } from "@/lib/i18n/es";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TemplatePackBuilder from "@/components/template-packs/TemplatePackBuilder";

export default function EditTemplatePackPage() {
  const params = useParams();
  const packId = Number(params.pack_id);
  const valid = Number.isInteger(packId) && packId > 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader
        title={es.pl.editarTitulo}
        subtitle={es.pl.editarSub}
        actions={
          <Button asChild variant="outline">
            <Link href="/template-packs">{es.pl.volver}</Link>
          </Button>
        }
      />
      {valid ? (
        <TemplatePackBuilder packId={packId} />
      ) : (
        <Alert variant="destructive">
          <AlertDescription>{es.pl.idInvalido}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
