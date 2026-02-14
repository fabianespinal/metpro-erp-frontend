"use client";

import React from "react";

/**
 * Unified status styles for all ERP modules.
 * Supports Projects, Invoices, Quotes, Orders, etc.
 */

const STATUS_STYLES = {
  // PROJECT STATUSES
  planning: "bg-gray-100 text-gray-800",
  active: "bg-purple-100 text-purple-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  on_hold: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",

  // INVOICE STATUSES
  draft: "bg-gray-100 text-gray-800",
  approved: "bg-blue-100 text-blue-800",
  invoiced: "bg-green-100 text-green-800",
  paid: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABELS = {
  // PROJECT LABELS
  planning: "Planning",
  active: "Active",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  cancelled: "Cancelled",

  // INVOICE LABELS
  draft: "Draft",
  approved: "Approved",
  invoiced: "Invoiced",
  paid: "Paid",
};

export default function StatusPill({ status }) {
  const normalized = status?.toLowerCase() || "planning";

  const style = STATUS_STYLES[normalized] || "bg-gray-100 text-gray-800";
  const label = STATUS_LABELS[normalized] || status || "Unknown";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style}`}
    >
      {label}
    </span>
  );
}