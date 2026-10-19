import { describe, expect, it } from "vitest";
import { businessMonth, businessToday, fmtDay, fmtTimestamp, localDate } from "@/lib/dates";

describe("business dates (B-04 / E-05)", () => {
  it("uses the Santo Domingo day, not UTC", () => {
    expect(businessToday(new Date("2026-10-19T01:30:00Z"))).toBe("2026-10-18");
    expect(businessToday(new Date("2026-10-19T04:00:00Z"))).toBe("2026-10-19");
    expect(businessMonth(new Date("2026-11-01T02:00:00Z"))).toBe("2026-10");
  });
  it("reads naive backend timestamps as UTC", () => {
    expect(localDate("2026-10-19T01:30:00")).toBe("2026-10-18");
    expect(localDate("2026-10-19T01:30:00.123456")).toBe("2026-10-18");
    expect(localDate("2026-10-19T01:30:00+00:00")).toBe("2026-10-18");
    expect(localDate("2026-10-18")).toBe("2026-10-18");
    expect(localDate(null)).toBe("");
  });
});

describe("display format dd/mm/aaaa (E-03)", () => {
  it("prints calendar dates as stored", () => {
    expect(fmtDay("2026-11-30")).toBe("30/11/2026");
    expect(fmtDay("2026-10-17T00:00:00+00:00")).toBe("17/10/2026"); // invoice_date: no shift
    expect(fmtDay("")).toBe("");
  });
  it("prints timestamps on their Santo Domingo day", () => {
    expect(fmtTimestamp("2026-10-19T01:30:00")).toBe("18/10/2026");
  });
});
