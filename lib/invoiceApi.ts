import { api } from "@/lib/api";

export async function fetchInvoice(id: number) {
  return api.get(`/invoices/${id}`);
}

export async function fetchInvoices() {
  return api.get("/invoices/");
}

export async function createInvoice(data: unknown) {
  return api.post("/invoices/", data);
}

export async function updateInvoice(id: number, data: unknown) {
  return api.put(`/invoices/${id}`, data);
}

export async function deleteInvoice(id: number) {
  return api.delete(`/invoices/${id}`);
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
  return api.post(`/invoices/${invoiceId}/payments`, data);
}

export async function fetchInvoicePayments(invoiceId: number) {
  return api.get(`/invoices/${invoiceId}/payments`);
}

export async function fetchInvoiceWithPayments(invoiceId: number) {
  const [invoice, payments] = await Promise.all([
    api.get(`/invoices/${invoiceId}`),
    api.get(`/invoices/${invoiceId}/payments`).catch(() => []),
  ]);

  return {
    ...(invoice as Record<string, unknown>),
    payments: Array.isArray(payments) ? payments : [],
  };
}