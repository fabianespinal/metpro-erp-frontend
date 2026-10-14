"use client";

import React from "react";

/**
 * Unified status styles for all ERP modules.
 * Supports Projects, Invoices, Quotes, Orders, etc.
 */

// Neutral = pre-work. Accent = in motion. Green = done or paid.
// Amber = held. Red = cancelled. Thin ring keeps badges flat.
const NEUTRAL = "bg-canvas text-muted ring-line";
const ACCENT = "bg-blue-50 text-blue-700 ring-blue-200";
const SUCCESS = "bg-emerald-50 text-emerald-700 ring-emerald-200";
const WARNING = "bg-amber-50 text-amber-700 ring-amber-200";
const DANGER = "bg-red-50 text-red-700 ring-red-200";

const STATUS_STYLES = {
  // PROJECT STATUSES
  planning: NEUTRAL,
  active: ACCENT,
  in_progress: ACCENT,
  completed: SUCCESS,
  on_hold: WARNING,
  cancelled: DANGER,

  // INVOICE STATUSES
  draft: NEUTRAL,
  approved: ACCENT,
  invoiced: SUCCESS,
  paid: SUCCESS,
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

  const style = STATUS_STYLES[normalized] || NEUTRAL;
  const label = STATUS_LABELS[normalized] || status || "Unknown";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}