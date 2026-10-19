import { afterEach, describe, expect, it, vi } from "vitest";
import { NETWORK_ERROR_MESSAGE, safeFetch } from "@/lib/api";

afterEach(() => vi.unstubAllGlobals());

describe("safeFetch (E-06)", () => {
  it("turns a network failure into the Spanish message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(safeFetch("http://x")).rejects.toMatchObject({ message: NETWORK_ERROR_MESSAGE, code: "NETWORK_ERROR" });
  });
  it("returns HTTP error responses unchanged", async () => {
    const res = new Response("{}", { status: 500 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));
    await expect(safeFetch("http://x")).resolves.toBe(res);
  });
});
