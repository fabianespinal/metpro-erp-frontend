"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Legacy route. The builder lives at /template-packs/[id]/edit. */
export default function TemplatePackRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/template-packs/${params.pack_id}/edit`);
  }, [params.pack_id, router]);
  return <p className="p-6 text-sm text-muted">Opening builder…</p>;
}
