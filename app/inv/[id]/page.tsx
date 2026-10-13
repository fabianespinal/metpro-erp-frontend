import InvoicePublicView from "@/components/InvoicePublicView";

interface PageProps {
  params: {
    id: string;
  };
}

export default function PublicInvoicePage({ params }: PageProps) {
  return <InvoicePublicView invoiceId={params.id} />;
}