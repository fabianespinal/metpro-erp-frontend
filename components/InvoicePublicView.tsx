"use client";

import { useEffect, useState } from "react";

export default function InvoicePublicView({ invoiceId }) {
  const [invoice, setInvoice] = useState(null);

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
      {/* Add more fields as needed */}
    </div>
  );
}