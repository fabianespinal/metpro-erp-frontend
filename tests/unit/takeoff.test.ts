import { describe, expect, it } from "vitest";
import { calculateQuoteTotals, dynamicChargeRows } from "@/components/quotes/quoteUtils";
import { itemProblem } from "@/lib/takeOffLines";

const packItems = [70, 125, 50, 10, 10, 25, 20].map((p, i) => ({
  product_name: `item ${i}`,
  quantity: 1,
  unit_price: p,
  discount_type: "none",
  discount_value: 0,
}));
const base = {
  supervision: true, supervision_percentage: 10, admin: true, admin_percentage: 4,
  insurance: true, insurance_percentage: 1, transport: true, transport_percentage: 3,
  contingency: true, contingency_percentage: 3,
};

describe("dynamicChargeRows (D1: custom and pack charges must show as rows)", () => {
  const dyn = [
    { id: "pack_9", name: "Flete pack", enabled: true, percentage: 10 },
    { id: "off", name: "Apagado", enabled: false, percentage: 50 },
    { id: "zero", name: "Cero", enabled: true, percentage: 0 },
  ];

  it("returns only enabled charges above zero, with the amount on items after discount", () => {
    const rows = dynamicChargeRows(dyn, "310.00");
    expect(rows).toEqual([{ id: "pack_9", name: "Flete pack", percentage: 10, amount: "31.00" }]);
  });

  it("visible rows add up to the subtotal (the 375.10 vs 406.10 repro)", () => {
    const t = calculateQuoteTotals(packItems, { ...base, dynamic_charges: dyn }, dyn);
    const rows = dynamicChargeRows(dyn, t.items_after_discount);
    const shown =
      Number(t.items_after_discount) +
      Number(t.supervision) + Number(t.admin) + Number(t.insurance) +
      Number(t.transport) + Number(t.contingency) +
      rows.reduce((s, r) => s + Number(r.amount), 0);
    expect(shown.toFixed(2)).toBe(t.subtotal_general);
    expect(t.subtotal_general).toBe("406.10");
  });

  it("handles missing or empty lists", () => {
    expect(dynamicChargeRows(undefined, "100")).toEqual([]);
    expect(dynamicChargeRows([], "100")).toEqual([]);
  });
});

describe("itemProblem (D2: a draft must not save a blank or zero-quantity row)", () => {
  const ok = { product_name: "Viga", quantity: 2, unit_price: 10, discount_type: "none", discount_value: 0 };

  it("accepts a valid row", () => {
    expect(itemProblem(ok)).toBeNull();
  });
  it("rejects a blank name", () => {
    expect(itemProblem({ ...ok, product_name: "   " })).not.toBeNull();
    expect(itemProblem({ ...ok, product_name: "" })).not.toBeNull();
  });
  it("rejects zero or missing quantity", () => {
    expect(itemProblem({ ...ok, quantity: 0 })).not.toBeNull();
    expect(itemProblem({ ...ok, quantity: undefined })).not.toBeNull();
  });
  it("rejects a negative price and a percentage discount over 100", () => {
    expect(itemProblem({ ...ok, unit_price: -1 })).not.toBeNull();
    expect(itemProblem({ ...ok, discount_type: "percentage", discount_value: 101 })).not.toBeNull();
  });
  it("allows decimal quantities such as pounds", () => {
    expect(itemProblem({ ...ok, quantity: 16531.2 })).toBeNull();
  });
});
