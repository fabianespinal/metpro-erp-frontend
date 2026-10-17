"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import TemplatePackBuilder from "@/components/template-packs/TemplatePackBuilder";

export default function NewTemplatePackPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <PageHeader
        title="New template pack"
        subtitle="Add categories and products. Set default quantities and mark optional items."
        actions={
          <Button asChild variant="outline">
            <Link href="/template-packs">Back</Link>
          </Button>
        }
      />
      <TemplatePackBuilder />
    </div>
  );
}
