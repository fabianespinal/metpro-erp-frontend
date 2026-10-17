"use client";

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
        title="Edit template pack"
        subtitle="Categories, products, default quantities and optional items."
        actions={
          <Button asChild variant="outline">
            <Link href="/template-packs">Back</Link>
          </Button>
        }
      />
      {valid ? (
        <TemplatePackBuilder packId={packId} />
      ) : (
        <Alert variant="destructive">
          <AlertDescription>Invalid template pack ID.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
