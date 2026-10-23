"use client";
import { use } from "react";
import RfqForm from "@/components/rfq/RfqForm";

export default function RfqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RfqForm id={Number(id)} />;
}
