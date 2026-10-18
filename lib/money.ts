/** ERP money display: $1,234.56 (same $ convention as the rest of the ERP, with thousands separators). */
export function money(v: unknown): string {
  const n = Number(v);
  return `$${(Number.isFinite(n) ? n : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
