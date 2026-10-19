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
