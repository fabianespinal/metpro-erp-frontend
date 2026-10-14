/**
 * Shared table styles (item 13, module 4).
 * Pages keep their own markup and apply these class strings. Presentation only.
 *
 *   <div className={dt.wrap}>
 *     <table className={dt.table}>
 *       <thead className={dt.thead}>
 *         <tr><th className={dt.th}>Name</th><th className={dt.thRight}>Total</th></tr>
 *       </thead>
 *       <tbody className={dt.tbody}>
 *         <tr className={dt.tr}><td className={dt.td}>…</td><td className={dt.tdRight}>…</td></tr>
 *       </tbody>
 *     </table>
 *   </div>
 */
export const dt = {
  wrap: "overflow-x-auto rounded-lg border border-line bg-surface shadow-card",
  table: "min-w-full divide-y divide-line text-sm",
  thead: "bg-canvas",
  th: "whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted",
  thRight: "whitespace-nowrap px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted",
  tbody: "divide-y divide-line bg-surface",
  tr: "transition-colors hover:bg-canvas",
  td: "whitespace-nowrap px-4 py-3 text-ink",
  tdRight: "whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink",
  empty: "px-4 py-10 text-center text-sm text-muted",
} as const
