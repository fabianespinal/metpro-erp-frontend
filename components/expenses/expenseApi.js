import { api } from "@/lib/api";

export async function createExpense(data) {
  return api("/expenses/", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function fetchExpenses() {
  return api("/expenses/", { method: "GET" });
}

export async function updateExpense(id, data) {
  return api(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function deleteExpense(id) {
  return api(`/expenses/${id}`, { method: "DELETE" });
}