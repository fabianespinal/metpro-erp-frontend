/**
 * Mirror of the backend automatic tax rule (tax/service.py). DISPLAY ONLY: the backend decides the
 * stored tax on every save. A quote uses the construction tax when at least one of the five construction
 * charges (supervision, admin, insurance, transport, contingency) is switched on and above 0. Custom
 * charges never trigger it (decision 2026-10-22, confirmed 2026-10-24). A missing or invalid percentage
 * counts as 0. Engineering estimate quotes always keep their own 1.8%.
 */
export const CONSTRUCTION_TAX_CODE = "construction_17_2017";
const STATIC_CHARGE_KEYS = ["supervision", "admin", "insurance", "transport", "contingency"] as const;

type Charges = Record<string, unknown> | null | undefined;

function positive(v: unknown): boolean {
  const n = Number(v ?? 0);
  return Number.isFinite(n) && n > 0;
}

export function chargesTriggerConstructionTax(charges: Charges): boolean {
  if (!charges) return false;
  for (const key of STATIC_CHARGE_KEYS) {
    if (charges[key] && positive(charges[`${key}_percentage`])) return true;
  }
  return false;
}

/** Code the backend will resolve for these charges. "" = the default type. */
export function taxCodeForCharges(charges: Charges): string {
  return chargesTriggerConstructionTax(charges) ? CONSTRUCTION_TAX_CODE : "";
}
