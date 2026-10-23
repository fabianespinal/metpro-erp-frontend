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

/** Void a payment entered by mistake (admin). The record is kept; balances are recomputed (debug B-14). */
export async function voidPayment(invoiceId: number, paymentId: number, reason: string) {
  return api.post(`/invoices/${invoiceId}/payments/${paymentId}/void`, { reason });
}

export interface PaymentOptions {
  void_enabled: boolean;
  correction_enabled: boolean;
  /** true = only admin and superadmin may record a payment (backend PAYMENT_RECORD_ADMIN_ONLY). */
  record_admin_only: boolean;
}

/** Feature switches for payment actions. Falls back to "correction off" if the backend predates A2. */
export async function fetchPaymentOptions(): Promise<PaymentOptions> {
  try {
    const d = (await api.get("/invoices/payment-options")) as Partial<PaymentOptions>;
    return {
      void_enabled: d?.void_enabled !== false,
      correction_enabled: d?.correction_enabled === true,
      record_admin_only: d?.record_admin_only === true,
    };
  } catch {
    return { void_enabled: true, correction_enabled: false, record_admin_only: false };
  }
}

/** Void a payment and record the corrected one in a single step (admin, A2). */
export async function correctPayment(
  invoiceId: number,
  paymentId: number,
  data: { amount: number; method: string; notes?: string; payment_date: string; reason: string }
) {
  return api.post(`/invoices/${invoiceId}/payments/${paymentId}/correct`, data);
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