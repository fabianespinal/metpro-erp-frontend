import { describe, expect, it } from "vitest";
import { linesFromPack, linesFromQuote, newManualLine, toQuoteItems } from "@/lib/takeOffLines";
import type { TemplatePack } from "@/lib/quotingApi";

const pack = {
  id: 1,
  name: "P",
  categories: [
    {
      id: 1,
      name: "C",
      items: [
        { id: 1, product_id: 1, product_name: "Visible", unit_price: 10, default_qty: 1, optional: false, sort_order: 0 },
        { id: 2, product_id: 2, product_name: "Oculta", unit_price: 20, default_qty: 1, optional: false, sort_order: 1, print_on_pdf: false },
      ],
    },
  ],
  charges: [],
} as unknown as TemplatePack;

describe("A3 print_on_pdf through the quote lines", () => {
  it("a pack keeps each item's state; a missing flag prints", () => {
    const lines = linesFromPack(pack);
    expect(lines.map((l) => l.print_on_pdf)).toEqual([true, false]);
  });
  it("saving always sends the flag, so a save can never un-hide a line", () => {
    const items = toQuoteItems(linesFromPack(pack));
    expect(items.map((i) => i.print_on_pdf)).toEqual([true, false]);
  });
  it("a saved quote loads its flags; new manual lines print", () => {
    const loaded = linesFromQuote([
      { id: 1, product_id: null, product_name: "x", quantity: 1, unit_price: 1, print_on_pdf: false },
      { id: 2, product_id: null, product_name: "y", quantity: 1, unit_price: 1 },
    ] as never);
    expect(loaded.map((l) => l.print_on_pdf)).toEqual([false, true]);
    expect(newManualLine("service").print_on_pdf).toBe(true);
  });
  it("hidden lines still count in the totals the screen computes", () => {
    const lines = linesFromPack(pack);
    expect(toQuoteItems(lines).reduce((s, i) => s + i.quantity * i.unit_price, 0)).toBe(30);
  });
});
