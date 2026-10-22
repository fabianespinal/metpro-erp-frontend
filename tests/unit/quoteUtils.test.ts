import { describe, expect, it } from "vitest";
import { calculateQuoteTotals, mergeQuotesWithInvoices } from "@/components/quotes/quoteUtils";

const items = [
  { quantity: 10, unit_price: 100, discount_type: "none", discount_value: 0 },
  { quantity: 2, unit_price: 50, discount_type: "percentage", discount_value: 10 },
  { quantity: 1, unit_price: 200, discount_type: "fixed", discount_value: 20 },
];
const charges = {
  supervision: true, supervision_percentage: 10, admin: true, admin_percentage: 4,
  insurance: false, insurance_percentage: 1, transport: false, transport_percentage: 3,
  contingency: false, contingency_percentage: 3,
};

describe("calculateQuoteTotals (same math as the backend)", () => {
  it("applies discounts, charges on the discounted base, then 18% ITBIS", () => {
    const t = calculateQuoteTotals(items, charges, []);
    expect(t.items_total).toBe("1300.00");
    expect(t.total_discounts).toBe("30.00");
    expect(t.items_after_discount).toBe("1270.00");
    expect(t.supervision).toBe("127.00");
    expect(t.admin).toBe("50.80");
    expect(t.subtotal_general).toBe("1447.80");
    expect(t.itbis).toBe("260.60");
    expect(t.grand_total).toBe("1708.40");
  });
  it("adds enabled dynamic charges only", () => {
    const t = calculateQuoteTotals(items, charges, [
      { id: "a", name: "Flete", enabled: true, percentage: 5 },
      { id: "b", name: "Off", enabled: false, percentage: 50 },
    ]);
    expect(t.dynamic_charges_total).toBe("63.50");
    expect(t.subtotal_general).toBe("1511.30");
  });
});

describe("mergeQuotesWithInvoices (B-06)", () => {
  const quotes = [{ quote_id: "q1", status: "Approved" }, { quote_id: "q2", status: "Invoiced" }];
  it("ignores cancelled invoices so the quote can be invoiced again", () => {
    const merged = mergeQuotesWithInvoices(quotes, [{ id: 1, quote_id: "q1", status: "Cancelled", invoice_number: "F-1" }]);
    expect(merged[0].has_invoice).toBe(false);
  });
  it("links the newest active invoice", () => {
    const merged = mergeQuotesWithInvoices(quotes, [
      { id: 1, quote_id: "q2", status: "Cancelled", invoice_number: "F-2" },
      { id: 2, quote_id: "q2", status: "Pending", invoice_number: "F-2-2" },
    ]);
    expect(merged[1].has_invoice).toBe(true);
    expect(merged[1].invoice_number).toBe("F-2-2");
  });
});

describe("calculateQuoteTotals tax rate (A1)", () => {
  const items = [{ quantity: 2, unit_price: 500, discount_type: "none", discount_value: 0 }];
  const off = { supervision: false, admin: false, insurance: false, transport: false, contingency: false };

  it("uses the rate passed from the quote's tax type", () => {
    const t = calculateQuoteTotals(items, off, [], 0.018);
    expect(t.itbis).toBe("18.00");
    expect(t.grand_total).toBe("1018.00");
  });
  it("keeps the pre-A1 result when no rate is passed", () => {
    const t = calculateQuoteTotals(items, off, []);
    expect(t.itbis).toBe("180.00");
    expect(t.grand_total).toBe("1180.00");
  });
  it("a zero rate is a rate, not a missing value", () => {
    expect(calculateQuoteTotals(items, off, [], 0).itbis).toBe("0.00");
  });
});

import { defaultChargesForEntry } from "@/lib/quotingApi";

describe("default indirect charges by entry point", () => {
  const keys = ["supervision", "admin", "insurance", "transport", "contingency"] as const;
  it("standard starts with all five OFF", () => {
    const c = defaultChargesForEntry("standard");
    keys.forEach((k) => expect(c[k]).toBe(false));
    expect(c.dynamic_charges).toEqual([]);
  });
  it("template and takeoff start with all five ON and standard percentages", () => {
    for (const e of ["template", "takeoff"] as const) {
      const c = defaultChargesForEntry(e);
      keys.forEach((k) => expect(c[k]).toBe(true));
      expect([c.supervision_percentage, c.admin_percentage, c.insurance_percentage, c.transport_percentage, c.contingency_percentage]).toEqual([10, 4, 1, 3, 3]);
    }
  });
  it("returns independent objects", () => {
    expect(defaultChargesForEntry("standard")).not.toBe(defaultChargesForEntry("standard"));
  });
});
