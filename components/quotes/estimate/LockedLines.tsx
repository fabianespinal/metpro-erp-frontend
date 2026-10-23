"use client";

import { formatMoney, lineTotal, type TakeOffLine } from "@/lib/takeOffLines";

/** Read-only lines for an estimate quote when the viewer cannot change money. */
export function LockedLines({ lines }: { lines: TakeOffLine[] }) {
  return (
    <ul className="divide-y divide-line rounded-lg border border-line bg-surface shadow-card" data-testid="locked-lines">
      {lines.map((l) => (
        <li key={l.key} className="grid grid-cols-12 items-baseline gap-2 px-4 py-2 text-sm">
          <span className="col-span-12 text-ink sm:col-span-6">{l.name}</span>
          <span className="col-span-4 text-right sm:col-span-2">{l.quantity}</span>
          <span className="col-span-4 text-right sm:col-span-2">{formatMoney(l.unit_price)}</span>
          <span className="col-span-4 text-right font-medium sm:col-span-2">{formatMoney(lineTotal(l))}</span>
        </li>
      ))}
    </ul>
  );
}
