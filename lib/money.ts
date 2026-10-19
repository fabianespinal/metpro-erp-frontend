/** ERP money display: $1,234.56 (same $ convention as the rest of the ERP, with thousands separators). */
export function money(v: unknown): string {
  const n = Number(v);
  const x = Number.isFinite(n) ? n : 0;
  const body = Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Negative amounts read -$81,660.50 (was $-81,660.50). Values that round to 0.00 carry no sign.
  return `${x < 0 && body !== "0.00" ? "-" : ""}$${body}`;
}
