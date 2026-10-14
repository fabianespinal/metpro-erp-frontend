/**
 * Shared filter bar styles (item 13, module 4).
 * Presentation only. Pages keep their own state and handlers.
 *
 *   <div className={fb.bar}>
 *     <div><label className={fb.label}>Status</label><select className={fb.control}>…</select></div>
 *   </div>
 */
export const fb = {
  bar: "mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4 shadow-card",
  label: "mb-1 block text-xs font-medium text-muted",
  control:
    "h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent",
} as const
