import { es } from "@/lib/i18n/es";
import { api } from "@/lib/api";
import { fetchCurrentRole, isAdminRole } from "@/lib/currentRole";

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
  // UI guard only. The backend enforces admin on DELETE /invoices/{id}.
  const role = await fetchCurrentRole();
  if (!isAdminRole(role)) {
    throw Object.assign(new Error(es.fact.permisos), { status: 403 });
  }
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
  let paymentsError: string | null = null;
  const [invoice, payments] = await Promise.all([
    api.get(`/invoices/${invoiceId}`),
    api.get(`/invoices/${invoiceId}/payments`).catch((err: Error) => {
      // The invoice still renders; the page shows that history could not load.
      paymentsError = err.message || "No se pudo cargar el historial de pagos.";
      return [];
    }),
  ]);

  return {
    ...(invoice as Record<string, unknown>),
    payments: Array.isArray(payments) ? payments : [],
    payments_error: paymentsError,
  };
}