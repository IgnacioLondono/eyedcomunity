import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPool } from "@/lib/db";
import { createEncryptedMedia, deleteOwnedMedia, QuotaExceededError } from "./service";
import { transformImage } from "./transform";

const runIntegration = Boolean(process.env.TEST_DB_HOST);

describe.skipIf(!runIntegration)("cuota concurrente con MySQL", () => {
  let root: string;
  const userId = `9${Date.now()}1234`;

  beforeAll(async () => {
    process.env.DB_HOST = process.env.TEST_DB_HOST;
    process.env.DB_PORT = process.env.TEST_DB_PORT || "3306";
    process.env.DB_NAME = process.env.TEST_DB_NAME || "eyedcomun_test";
    process.env.DB_USER = process.env.TEST_DB_USER;
    process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;
    process.env.MEDIA_ENCRYPTION_KEY = Buffer.alloc(32, 3).toString("base64");
    root = await fs.mkdtemp(path.join(os.tmpdir(), "eyedcomun-quota-"));
    process.env.MEDIA_STORAGE_PATH = root;
  });

  afterAll(async () => {
    await getPool().query("DELETE FROM community_users WHERE discord_id = ?", [userId]).catch(() => undefined);
    await getPool().end().catch(() => undefined);
    await fs.rm(root, { recursive: true, force: true });
  });

  it("solo permite una de dos reservas simultáneas", async () => {
    const png = await sharp({
      create: { width: 300, height: 300, channels: 3, background: "#7650c8" },
    }).png().toBuffer();
    const file = new File([png], "avatar.png", { type: "image/png" });
    const normalized = await transformImage(file, "avatar");

    await getPool().query(
      `INSERT INTO community_users (discord_id, quota_bytes) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE used_bytes = 0, quota_bytes = VALUES(quota_bytes)`,
      [userId, normalized.data.length],
    );

    const results = await Promise.allSettled([
      createEncryptedMedia(userId, "avatar", file),
      createEncryptedMedia(userId, "avatar", file),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(QuotaExceededError);
    await deleteOwnedMedia(userId, (fulfilled[0] as PromiseFulfilledResult<{ id: string }>).value.id);
  });
});
