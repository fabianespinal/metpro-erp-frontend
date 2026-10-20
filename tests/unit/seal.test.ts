import { describe, expect, it } from "vitest";
import { sendBody } from "@/lib/api";
import { sealQuery } from "@/lib/sealApi";
import { sealState } from "@/lib/useSealSettings";
import type { SealSettings } from "@/lib/sealApi";

const settings = (over: Partial<SealSettings> = {}): SealSettings => ({
  configured: true,
  enabled_by_default: true,
  storage_ready: true,
  updated_at: null,
  updated_by: null,
  ...over,
});

describe("sealQuery", () => {
  it("adds the parameter only for an explicit true", () => {
    expect(sealQuery(true)).toBe("?print_seal=true");
    expect(sealQuery(false)).toBe("");
  });

  it("never adds it for truthy look-alikes", () => {
    for (const v of [undefined, null, 1, "true", "yes", {}] as unknown[]) {
      expect(sealQuery(v as boolean)).toBe("");
    }
  });
});

describe("sendBody", () => {
  it("sends nothing at all when there are no files and no seal (the request as it always was)", () => {
    expect(sendBody()).toBeUndefined();
    expect(sendBody([])).toBeUndefined();
    expect(sendBody([], false)).toBeUndefined();
  });

  it("sends only the seal flag when there are no files", () => {
    const fd = sendBody([], true)!;
    expect(fd.get("print_seal")).toBe("true");
    expect(fd.getAll("files")).toHaveLength(0);
  });

  it("keeps the files and leaves the flag out when no seal is wanted", () => {
    const fd = sendBody([new File(["a"], "plano.pdf")], false)!;
    expect(fd.getAll("files")).toHaveLength(1);
    expect(fd.has("print_seal")).toBe(false);
  });

  it("sends files and the seal flag together", () => {
    const fd = sendBody([new File(["a"], "a.pdf"), new File(["b"], "b.jpg")], true)!;
    expect(fd.getAll("files")).toHaveLength(2);
    expect(fd.get("print_seal")).toBe("true");
  });

  it("does not treat a truthy non-boolean as a request for the seal", () => {
    expect(sendBody([], "true" as unknown as boolean)).toBeUndefined();
  });
});

describe("sealState (what the dialogs show)", () => {
  it("pre-checks the box only when a seal exists and the default is on", () => {
    expect(sealState(settings())).toEqual({ configured: true, enabledByDefault: true });
    expect(sealState(settings({ enabled_by_default: false }))).toEqual({ configured: true, enabledByDefault: false });
  });

  it("never pre-checks without a seal, even if the default flag is on", () => {
    expect(sealState(settings({ configured: false, enabled_by_default: true }))).toEqual({
      configured: false,
      enabledByDefault: false,
    });
  });

  it("fails closed when the settings could not be loaded", () => {
    expect(sealState(null)).toEqual({ configured: false, enabledByDefault: false });
  });
});
