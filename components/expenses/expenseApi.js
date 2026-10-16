import { api } from "@/lib/api";

// -----------------------------
// GET ALL EXPENSES
// -----------------------------
export async function fetchExpenses() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return api("/expenses", {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    }
  });
}

// -----------------------------
// CREATE EXPENSE
// -----------------------------
export async function createExpense(data) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return api("/expenses", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

// -----------------------------
// UPDATE EXPENSE
// -----------------------------
export async function updateExpense(id, data) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return api(`/expenses/${id}`, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

// -----------------------------
// DELETE EXPENSE
// -----------------------------
export async function deleteExpense(id) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  return api(`/expenses/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    }
  });
}