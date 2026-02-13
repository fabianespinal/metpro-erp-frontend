/**
 * QuoteActions.js
 * Centralized module for all quote-related API operations
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Helper to build headers with auth token
 */
function getHeaders(token, isJSON) {
  const headers = {
    Authorization: "Bearer " + token,
  };
  if (isJSON === true) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

/**
 * Helper to handle API errors
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = "Request failed with status " + response.status;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // Response wasn't JSON, use default message
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }
  return response;
}

/**
 * Preview PDF - returns blob for caller to handle
 */
export async function previewPDF(quoteId, token) {
  try {
    const url = API_URL + "/pdf/quotes/" + quoteId;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(token, false),
    });

    await handleResponse(response);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Preview PDF error:", error);
    throw error;
  }
}

/**
 * Download PDF - returns blob for caller to handle
 */
export async function downloadPDF(quoteId, token) {
  try {
    const url = API_URL + "/pdf/quotes/" + quoteId;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(token, false),
    });

    await handleResponse(response);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Download PDF error:", error);
    throw error;
  }
}

/**
 * Approve quote
 */
export async function approveQuote(quoteId, token) {
  try {
    const url = API_URL + "/quotes/" + quoteId + "/approve";
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(token, true),
    });

    await handleResponse(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Approve quote error:", error);
    throw error;
  }
}

/**
 * Duplicate quote
 */
export async function duplicateQuote(quoteId, token) {
  try {
    const url = API_URL + "/quotes/" + quoteId + "/duplicate";
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(token, true),
    });

    await handleResponse(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Duplicate quote error:", error);
    throw error;
  }
}

/**
 * Delete quote
 */
export async function deleteQuote(quoteId, token) {
  try {
    const url = API_URL + "/quotes/" + quoteId;
    const response = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(token, true),
    });

    await handleResponse(response);
    
    // Some APIs return 204 No Content on successful delete
    if (response.status === 204) {
      return { success: true };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Delete quote error:", error);
    throw error;
  }
}

/**
 * Edit quote
 */
export async function editQuote(quoteId, token, payload) {
  try {
    const url = API_URL + "/quotes/" + quoteId;
    const response = await fetch(url, {
      method: "PUT",
      headers: getHeaders(token, true),
      body: JSON.stringify(payload),
    });

    await handleResponse(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Edit quote error:", error);
    throw error;
  }
}

/**
 * Convert quote to invoice
 */
export async function convertToInvoice(quoteId, token) {
  try {
    const url = API_URL + "/quotes/" + quoteId + "/convert-to-invoice";
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(token, true),
    });

    await handleResponse(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Convert to invoice error:", error);
    throw error;
  }
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(quoteId, token, newStatus) {
  try {
    const url = API_URL + "/quotes/" + quoteId + "/status";
    const response = await fetch(url, {
      method: "PATCH",
      headers: getHeaders(token, true),
      body: JSON.stringify({ status: newStatus }),
    });

    await handleResponse(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Update status error:", error);
    throw error;
  }
}

/**
 * Generate conduce for invoice
 */
export async function generateConduce(invoiceId, token) {
  try {
    const url = API_URL + "/pdf/invoices/" + invoiceId + "/conduce";
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(token, false),
    });

    await handleResponse(response);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Generate conduce error:", error);
    throw error;
  }
}

/**
 * Fetch all quotes (optional helper)
 */
export async function fetchQuotes(token, params) {
  try {
    let url = API_URL + "/quotes";
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      if (queryString) {
        url = url + "?" + queryString;
      }
    }
    
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(token, true),
    });

    await handleResponse(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch quotes error:", error);
    throw error;
  }
}

/**
 * Fetch single quote (optional helper)
 */
export async function fetchQuote(quoteId, token) {
  try {
    const url = API_URL + "/quotes/" + quoteId;
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(token, true),
    });

    await handleResponse(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch quote error:", error);
    throw error;
  }
}

/**
 * Create new quote (optional helper)
 */
export async function createQuote(token, payload) {
  try {
    const url = API_URL + "/quotes";
    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(token, true),
      body: JSON.stringify(payload),
    });

    await handleResponse(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Create quote error:", error);
    throw error;
  }
}