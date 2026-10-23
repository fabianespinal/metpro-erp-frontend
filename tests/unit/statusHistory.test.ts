import { describe, expect, it } from "vitest";
import { fmtDateTime } from "@/lib/dates";
import { lastChangeText } from "@/lib/statusHistory";
import { getStatusLabel } from "@/lib/i18n/statusLabel";

describe("status history text (S2)", () => {
  it("prints the Santo Domingo clock as dd/mm/aaaa HH:mm", () => {
    expect(fmtDateTime("2026-10-23T16:05:00+00:00")).toBe("23/10/2026 12:05");
    expect(fmtDateTime("2026-10-23T16:05:00")).toBe("23/10/2026 12:05"); // naive = UTC
    expect(fmtDateTime("2026-10-24T03:30:00Z")).toBe("23/10/2026 23:30"); // still the 23rd locally
    expect(fmtDateTime(null)).toBe("");
  });
  it("builds the Estado line", () => {
    expect(lastChangeText("Ana", "2026-10-23T16:05:00Z")).toBe("por Ana · 23/10/2026 12:05");
    expect(lastChangeText(null, "2026-10-23T16:05:00Z")).toBe("por — · 23/10/2026 12:05");
  });
  it("is null when nothing was recorded (switch off or old record)", () => {
    expect(lastChangeText(null, null)).toBeNull();
    expect(lastChangeText(undefined, undefined)).toBeNull();
  });
  it("labels Deleted and Invoiced in Spanish", () => {
    expect(getStatusLabel("Deleted", "f")).toBe("Eliminada");
    expect(getStatusLabel("Invoiced", "f")).toBe("Facturada");
  });
});
