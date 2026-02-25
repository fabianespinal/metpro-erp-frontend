import InvoicePublicView from "@/components/InvoicePublicView";

export default function PublicInvoicePage({ params }) {
  return <InvoicePublicView invoiceId={params.id} />;
}