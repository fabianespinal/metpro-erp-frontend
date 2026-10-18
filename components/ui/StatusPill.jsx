"use client";

import React from "react";
import { getStatusLabel } from "@/lib/i18n/statusLabel";

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
  pending: NEUTRAL,
  planning: NEUTRAL,
  active: ACCENT,
  in_progress: ACCENT,
  completed: SUCCESS,
  on_hold: WARNING,
  cancelled: DANGER,
  overdue: DANGER,

  // QUOTE AND INVOICE STATUSES
  draft: NEUTRAL,
  final: ACCENT,
  sent: ACCENT,
  approved: ACCENT,
  rejected: DANGER,
  invoiced: SUCCESS,
  paid: SUCCESS,
  partial: WARNING,
};

// gender: "f" for quotes and invoices, "m" for projects and payments (default).
export default function StatusPill({ status, gender = "m" }) {
  const normalized = status?.toLowerCase() || "planning";

  const style = STATUS_STYLES[normalized] || NEUTRAL;
  const label = getStatusLabel(status, gender);

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}