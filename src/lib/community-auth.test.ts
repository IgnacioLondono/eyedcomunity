import { afterEach, describe, expect, it } from "vitest";
import { membershipCacheValue } from "./membership-cache";

describe("caché de membresía", () => {
  it("solo cachea éxito y denegaciones definitivas", () => {
    expect(membershipCacheValue(200)).toBe(true);
    expect(membershipCacheValue(403)).toBe(false);
    expect(membershipCacheValue(404)).toBe(false);
  });

  it("no convierte 429 ni 5xx en una denegación cacheada", () => {
    expect(membershipCacheValue(429)).toBeNull();
    expect(membershipCacheValue(500)).toBeNull();
    expect(membershipCacheValue(503)).toBeNull();
  });
});

import { ApiAccessError, assertSameOrigin } from "./bff-guards";

describe("guard BFF same-origin", () => {
  afterEach(() => {
    delete process.env.AUTH_URL;
  });

  it("acepta el origen configurado", () => {
    process.env.AUTH_URL = "https://portal.example";
    expect(() => assertSameOrigin(new Request("https://portal.example/api/test", {
      headers: { Origin: "https://portal.example" },
    }))).not.toThrow();
  });

  it("rechaza origen ausente o distinto", () => {
    process.env.AUTH_URL = "https://portal.example";
    for (const origin of [undefined, "https://evil.example"]) {
      const request = new Request("https://portal.example/api/test", {
        headers: origin ? { Origin: origin } : {},
      });
      expect(() => assertSameOrigin(request)).toThrowError(ApiAccessError);
    }
  });
});
