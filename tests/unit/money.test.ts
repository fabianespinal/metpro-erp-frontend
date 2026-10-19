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
