import { api } from "@/lib/api";

export async function fetchExpenses() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return api("/expenses/", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    }
  });
}

export async function createExpense(data) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return api("/expenses/", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    }
  });
}

export async function updateExpense(id, data) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return api(`/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    }
  });
}

export async function deleteExpense(id) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return api(`/expenses/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    }
  });
}