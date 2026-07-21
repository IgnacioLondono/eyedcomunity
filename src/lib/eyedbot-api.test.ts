import { createHash, createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  buildCommunitySignedHeaders,
  canonicalCommunityRequest,
  eyedBotRequest,
} from "./eyedbot-api";

const userId = "123456789012345678";
const secret = "signing-secret-for-tests";

describe("firma comunitaria", () => {
  beforeEach(() => {
    process.env.COMMUNITY_API_KEY = "api-key";
    process.env.COMMUNITY_SIGNING_SECRET = secret;
    process.env.EYEDBOT_API_URL = "http://eyedbot.test";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("usa el canonical exacto del backend y excluye el query", () => {
    const body = JSON.stringify({ status: "active" });
    const canonical = canonicalCommunityRequest({
      method: "patch",
      path: "/api/community/plans/abc/status?ignored=yes",
      body,
      userId,
      timestamp: "1700000000000",
      nonce: "abcdefghijklmnop",
    });
    expect(canonical).toBe([
      "PATCH",
      "/api/community/plans/abc/status",
      createHash("sha256").update(body).digest("hex"),
      userId,
      "1700000000000",
      "abcdefghijklmnop",
    ].join("\n"));
  });

  it("genera Bearer y HMAC sobre el canonical", () => {
    const input = {
      method: "GET",
      path: "/api/community/ranking?metric=xp",
      userId,
      timestamp: "1700000000000",
      nonce: "abcdefghijklmnop",
    };
    const headers = buildCommunitySignedHeaders(input);
    expect(headers.Authorization).toBe("Bearer api-key");
    expect(headers["X-Community-Signature"]).toBe(
      createHmac("sha256", secret).update(canonicalCommunityRequest(input)).digest("hex"),
    );
  });

  it("rechaza respuestas upstream que no cumplen Zod", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ value: "no-es-numero" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ));
    await expect(eyedBotRequest("/api/community/test", {
      userId,
      schema: z.object({ value: z.number() }),
    })).rejects.toMatchObject({
      status: 502,
      code: "INVALID_UPSTREAM_RESPONSE",
    });
  });
});
