import { api } from "@/lib/api";

export async function fetchInvoice(id: number) {
  return api(`/invoices/${id}`, { method: "GET" });
}

export async function fetchInvoices() {
  return api("/invoices/", { method: "GET" });
}

export async function createInvoice(data: unknown) {
  return api("/invoices/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateInvoice(id: number, data: unknown) {
  return api(`/invoices/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteInvoice(id: number) {
  return api(`/invoices/${id}`, { method: "DELETE" });
}

/* -------------------------------------------------------
   PAYMENT FUNCTIONS
------------------------------------------------------- */

export async function createPayment(
  invoiceId: number,
  data: {
    amount: number;
    method: string;
    notes?: string;
    payment_date: string;
  }
) {
  return api(`/invoices/${invoiceId}/payments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchInvoicePayments(invoiceId: number) {
  return api(`/invoices/${invoiceId}/payments`, {
    method: "GET",
  });
}

export async function fetchInvoiceWithPayments(invoiceId: number) {
  const [invoice, payments] = await Promise.all([
    api(`/invoices/${invoiceId}`, { method: "GET" }),
    api(`/invoices/${invoiceId}/payments`, { method: "GET" }).catch(() => []),
  ]);

  return {
    ...invoice,
    payments: Array.isArray(payments) ? payments : [],
  };
}