"use client";
import { use } from "react";
import PoForm from "@/components/po/PoForm";

export default function PoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PoForm id={Number(id)} />;
}
