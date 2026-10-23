import { describe, expect, it } from "vitest";
import { linesFromPack, linesFromQuote, newManualLine, newProductLine, toQuoteItems } from "@/lib/takeOffLines";
import { moneyChanged } from "@/lib/estimatorCalc";
import { NO_PDF_OPTIONS, UNIT_SUGGESTIONS } from "@/lib/pdfOptions";
import type { QuoteItemOut } from "@/lib/quotingApi";

const saved = (over: Partial<QuoteItemOut> = {}): QuoteItemOut => ({
  id: 1, quote_id: "q", product_id: 5, product_name: "Viga", quantity: 2, unit_price: 500,
  discount_type: "none", discount_value: 0, item_type: "product", ...over,
});

describe("Medidas on take-off lines", () => {
  it("a product line starts with the product's unit and sends it", () => {
    const line = newProductLine({ id: 5, name: "Viga", unit_price: 500, unit_of_measure: "Ft" });
    expect(toQuoteItems([line])[0].unit_of_measure).toBe("Ft");
  });

  it("a product with no unit starts blank and sends an empty unit (no surprise re-fill)", () => {
    expect(toQuoteItems([newProductLine({ id: 5, name: "Viga", unit_price: 1 })])[0].unit_of_measure).toBe("");
  });

  it("pack lines never set a unit, so the backend takes the product's", () => {
    const lines = linesFromPack({ categories: [{ name: "A", items: [{ id: 1, product_id: 9, product_name: "X", default_qty: 1, unit_price: 3, optional: false }] }] } as never);
    expect(lines[0].unit_of_measure).toBeNull();
    expect("unit_of_measure" in toQuoteItems(lines)[0]).toBe(false);
  });

  it("a saved line keeps its unit, and a saved null stays blank", () => {
    expect(linesFromQuote([saved({ unit_of_measure: "Ton" })])[0].unit_of_measure).toBe("Ton");
    expect(toQuoteItems(linesFromQuote([saved({ unit_of_measure: null })]))[0].unit_of_measure).toBe("");
    expect(toQuoteItems(linesFromQuote([saved()]))[0].unit_of_measure).toBe("");
  });

  it("the unit is trimmed and free text", () => {
    const line = { ...newManualLine("custom"), name: "Tramo", unit_of_measure: "  Tramo largo " };
    expect(toQuoteItems([line])[0].unit_of_measure).toBe("Tramo largo");
  });

  it("suggestions are the agreed ones, nothing enforced", () => {
    expect([...UNIT_SUGGESTIONS]).toEqual(["Unidad", "Ft", "M", "M2", "Ton", "Lb", "Set", "Pie", "Cola"]);
  });
});

describe("Medidas is not money", () => {
  const snap = (unit: string, price = 500) =>
    JSON.stringify({ items: [{ product_name: "Viga", quantity: 2, unit_price: price, unit_of_measure: unit }], included_charges: {} });

  it("changing a unit is not a money change (no edit reason on estimate quotes)", () => {
    expect(moneyChanged(snap("Ft"), snap("M"))).toBe(false);
  });

  it("changing a price still is", () => {
    expect(moneyChanged(snap("Ft"), snap("Ft", 600))).toBe(true);
  });
});

describe("PDF options fail closed", () => {
  it("everything is off by default", () => {
    expect(NO_PDF_OPTIONS).toEqual({ medidas_enabled: false, print_items_enabled: false, project_desc_enabled: false, full_copy_enabled: false });
  });
});
