import { describe, expect, it } from "vitest";
import { taxCodeForCharges } from "@/lib/taxRule";

const base = { supervision: false, supervision_percentage: 10, admin: false, admin_percentage: 4, dynamic_charges: [] };
describe("taxCodeForCharges", () => {
  it("default when no charge is on", () => expect(taxCodeForCharges(base)).toBe(""));
  it("construction when a charge is on with a percentage", () =>
    expect(taxCodeForCharges({ ...base, admin: true })).toBe("construction_17_2017"));
  it("a 0% charge does not trigger", () => expect(taxCodeForCharges({ ...base, admin: true, admin_percentage: 0 })).toBe(""));
  it("missing percentage counts as 0", () => expect(taxCodeForCharges({ admin: true })).toBe(""));
  it("dynamic charge triggers when enabled", () =>
    expect(taxCodeForCharges({ ...base, dynamic_charges: [{ enabled: true, percentage: 2 }] })).toBe("construction_17_2017"));
  it("disabled dynamic charge does not", () =>
    expect(taxCodeForCharges({ ...base, dynamic_charges: [{ enabled: false, percentage: 2 }] })).toBe(""));
  it("only first 3 dynamic charges count", () =>
    expect(taxCodeForCharges({ dynamic_charges: [{}, {}, {}, { enabled: true, percentage: 5 }] })).toBe(""));
  it("null charges", () => expect(taxCodeForCharges(null)).toBe(""));
});
