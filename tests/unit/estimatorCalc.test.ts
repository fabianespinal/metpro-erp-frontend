import { describe, expect, it } from "vitest";
import {
  DEFAULT_FORM,
  buildRequest,
  compareParity,
  formProblem,
  isEstimateQuote,
  moneyLocked,
  needsEditReason,
  overrideProblemRow,
  overridesFromDrafts,
  parseNumber,
} from "@/lib/estimatorCalc";
import { estimatorErrorMessage } from "@/lib/estimatorApi";
import type { EstimatePreview } from "@/lib/estimatorApi";

const preview = {
  intermediates: { E42: 100, C93: 12 },
  lines: [{ row: 78, total: 500.5 }],
  subtotal_unrounded: 7386322.472,
} as unknown as EstimatePreview;

describe("form", () => {
  it("default case has no problem", () => expect(formProblem(DEFAULT_FORM)).toBeNull());
  it("parses comma decimals", () => expect(parseNumber("7,5")).toBe(7.5));
  it("rejects empty and non-numbers", () => {
    expect(parseNumber("")).toBeNull();
    expect(formProblem({ ...DEFAULT_FORM, ancho: "abc" })).toMatch(/números/);
  });
  it("rejects zero size, allows zero front columns", () => {
    expect(formProblem({ ...DEFAULT_FORM, largo: "0" })).toMatch(/mayores/);
    expect(formProblem({ ...DEFAULT_FORM, columnas_frontales: "0" })).toBeNull();
    expect(formProblem({ ...DEFAULT_FORM, columnas_frontales: "-1" })).toMatch(/mayores/);
  });
  it("refuses fractional frames", () => {
    expect(formProblem({ ...DEFAULT_FORM, largo: "46" })).toMatch(/múltiplo/);
  });
});

describe("overrides", () => {
  it("needs a reason when a value is set", () => {
    expect(overrideProblemRow({ 78: { unit_price: "5", quantity: "", reason: "" } })).toBe(78);
    expect(overrideProblemRow({ 78: { unit_price: "5", quantity: "", reason: "cliente" } })).toBeNull();
  });
  it("ignores empty drafts", () => {
    expect(overrideProblemRow({ 78: { unit_price: "", quantity: "", reason: "" } })).toBeNull();
    expect(overridesFromDrafts({ 78: { unit_price: "", quantity: "", reason: "x" } })).toEqual([]);
  });
  it("rejects negative values", () => {
    expect(overrideProblemRow({ 9: { unit_price: "-1", quantity: "", reason: "x" } })).toBe(9);
  });
  it("builds sorted payload, price and quantity optional", () => {
    const out = overridesFromDrafts({
      90: { unit_price: "", quantity: "3", reason: " a " },
      78: { unit_price: "2,5", quantity: "", reason: "b" },
    });
    expect(out).toEqual([
      { row: 78, unit_price: 2.5, reason: "b" },
      { row: 90, quantity: 3, reason: "a" },
    ]);
  });
  it("buildRequest is null while invalid, shaped when valid", () => {
    expect(buildRequest({ ...DEFAULT_FORM, largo: "46" }, {})).toBeNull();
    const r = buildRequest(DEFAULT_FORM, {});
    expect(r?.ancho).toBe(18);
    expect(r?.distancia_ejes).toBe(7.5);
    expect(r?.perfiles.frenado).toBe("W10x12");
    expect(r?.overrides).toEqual([]);
  });
});

describe("parity", () => {
  it("matches within tolerance and flags differences", () => {
    const { rows, unknown } = compareParity(preview, { e42: "100", F78: "500.6", F122: "7386322.472", Z1: "1" });
    expect(rows.find((r) => r.cell === "E42")?.matches).toBe(true);
    expect(rows.find((r) => r.cell === "F78")?.matches).toBe(false);
    expect(rows.find((r) => r.cell === "F122")?.matches).toBe(true);
    expect(unknown).toEqual(["Z1"]);
  });
  it("skips blank entries", () => {
    expect(compareParity(preview, { E42: "" }).rows).toEqual([]);
  });
});

describe("estimate quote lock", () => {
  it("only engineering_estimate is locked", () => {
    expect(isEstimateQuote({ quote_type: "engineering_estimate" })).toBe(true);
    expect(isEstimateQuote({ quote_type: null })).toBe(false);
    expect(isEstimateQuote(undefined)).toBe(false);
  });
  it("locks non-admin, asks reason from admin, leaves others alone", () => {
    const q = { quote_type: "engineering_estimate" };
    expect(moneyLocked(q, false)).toBe(true);
    expect(moneyLocked(q, true)).toBe(false);
    expect(needsEditReason(q, true)).toBe(true);
    expect(needsEditReason({ quote_type: null }, true)).toBe(false);
    expect(moneyLocked({ quote_type: "standard" }, false)).toBe(false);
  });
});

describe("errors", () => {
  it("maps known codes, falls back to message", () => {
    expect(estimatorErrorMessage({ code: "FRAMES_NOT_WHOLE", message: "x" })).toMatch(/múltiplo/);
    expect(estimatorErrorMessage({ code: "OTHER", message: "boom" })).toBe("boom");
  });
});
