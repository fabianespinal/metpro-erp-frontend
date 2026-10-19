import { describe, expect, it } from "vitest";
import { money } from "@/lib/money";

describe("money (E-02)", () => {
  it("formats with $ and thousands separators", () => {
    expect(money(220235.34)).toBe("$220,235.34");
    expect(money("1068346.84")).toBe("$1,068,346.84");
    expect(money(0)).toBe("$0.00");
  });
  it("puts the sign before $ and never prints -$0.00", () => {
    expect(money(-81660.5)).toBe("-$81,660.50");
    expect(money(-0.001)).toBe("$0.00");
  });
  it("treats bad input as 0", () => {
    expect(money(null)).toBe("$0.00");
    expect(money("abc")).toBe("$0.00");
    expect(money(Number.NaN)).toBe("$0.00");
  });
});

import { qty } from "@/lib/money";

describe("qty (E-11)", () => {
  it("prints whole numbers without decimals and keeps real fractions", () => {
    expect(qty(120)).toBe("120");
    expect(qty("2.5")).toBe("2.5");
    expect(qty(0.255)).toBe("0.26");
    expect(qty(1200)).toBe("1,200");
    expect(qty(null)).toBe("0");
    expect(qty("abc")).toBe("0");
  });
});
