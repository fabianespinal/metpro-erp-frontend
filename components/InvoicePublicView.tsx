"use client";

import { useEffect, useState } from "react";

interface InvoicePublicViewProps {
  invoiceId: string;
}

export default function InvoicePublicView({ invoiceId }: InvoicePublicViewProps) {
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    fetch(`https://api.metprord.com/public/invoices/${invoiceId}`)
      .then(res => res.json())
      .then(data => setInvoice(data));
  }, [invoiceId]);

  if (!invoice) return <p>Cargando factura...</p>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Factura #{invoice.invoice_number}</h1>
      <p>Cliente: {invoice.client_name}</p>
      <p>Total: {invoice.total_amount}</p>
    </div>
  );
}