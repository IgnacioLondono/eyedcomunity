import "server-only";

import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { ensureMigrations, getPool } from "@/lib/db";
import { currentKeyVersion, decryptMedia, encryptMedia, type EncryptionContext } from "./crypto";
import { cleanupTemporaryFiles, objectPath, readEncrypted, removeEncrypted, writeAtomic } from "./storage";
import { transformImage, type MediaPurpose } from "./transform";

export class QuotaExceededError extends Error {}

export interface MediaRecord extends RowDataPacket {
  id: string;
  owner_id: string;
  purpose: MediaPurpose;
  mime_type: string;
  width: number;
  height: number;
  plaintext_bytes: number;
  encrypted_bytes: number;
  storage_path: string;
  nonce_hex: string;
  auth_tag_hex: string;
  key_version: number;
  status: string;
}

export async function createEncryptedMedia(ownerId: string, purpose: MediaPurpose, file: File) {
  await ensureMigrations();
  const transformed = await transformImage(file, purpose);
  const id = randomUUID();
  const keyVersion = currentKeyVersion();
  const context: EncryptionContext = {
    id,
    ownerId,
    purpose,
    mimeType: transformed.mimeType,
    keyVersion,
  };
  const encrypted = encryptMedia(transformed.data, context);
  const relativePath = objectPath(id);
  const encryptedBytes = encrypted.ciphertext.length;
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      "INSERT IGNORE INTO community_users (discord_id) VALUES (?)",
      [ownerId],
    );
    const [quotaResult] = await connection.query<ResultSetHeader>(
      `UPDATE community_users
       SET used_bytes = used_bytes + ?
       WHERE discord_id = ? AND used_bytes + ? <= quota_bytes`,
      [encryptedBytes, ownerId, encryptedBytes],
    );
    if (quotaResult.affectedRows !== 1) throw new QuotaExceededError("No tienes espacio suficiente");
    await connection.query(
      `INSERT INTO media_assets
       (id, owner_id, purpose, mime_type, width, height, plaintext_bytes, encrypted_bytes,
        storage_path, nonce_hex, auth_tag_hex, key_version, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        id, ownerId, purpose, transformed.mimeType, transformed.width, transformed.height,
        transformed.data.length, encryptedBytes, relativePath, encrypted.nonce.toString("hex"),
        encrypted.authTag.toString("hex"), keyVersion,
      ],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  try {
    await writeAtomic(relativePath, encrypted.ciphertext);
    await pool.query("UPDATE media_assets SET status = 'ready' WHERE id = ?", [id]);
  } catch (error) {
    await releaseReservedAsset(id, ownerId, encryptedBytes, relativePath);
    throw error;
  }

  return {
    id,
    url: `/api/media/${id}`,
    width: transformed.width,
    height: transformed.height,
    bytes: encryptedBytes,
  };
}

export async function getMediaRecord(id: string) {
  await ensureMigrations();
  const [rows] = await getPool().query<MediaRecord[]>(
    "SELECT * FROM media_assets WHERE id = ? AND status = 'ready' LIMIT 1",
    [id],
  );
  return rows[0] || null;
}

export async function decryptMediaRecord(record: MediaRecord) {
  const ciphertext = await readEncrypted(record.storage_path);
  return decryptMedia(
    ciphertext,
    {
      id: record.id,
      ownerId: record.owner_id,
      purpose: record.purpose,
      mimeType: record.mime_type,
      keyVersion: record.key_version,
    },
    Buffer.from(record.nonce_hex, "hex"),
    Buffer.from(record.auth_tag_hex, "hex"),
  );
}

export async function setProfileMedia(ownerId: string, purpose: "avatar" | "banner", mediaId: string) {
  const column = purpose === "avatar" ? "avatar_media_id" : "banner_media_id";
  const pool = getPool();
  const connection = await pool.getConnection();
  let oldId: string | null = null;
  try {
    await connection.beginTransaction();
    const [assets] = await connection.query<MediaRecord[]>(
      "SELECT * FROM media_assets WHERE id = ? AND owner_id = ? AND purpose = ? AND status = 'ready' FOR UPDATE",
      [mediaId, ownerId, purpose],
    );
    if (!assets[0]) throw new Error("El medio no pertenece al perfil");
    await connection.query(
      "INSERT IGNORE INTO custom_profiles (discord_id) VALUES (?)",
      [ownerId],
    );
    const [profiles] = await connection.query<Array<RowDataPacket & { media_id: string | null }>>(
      `SELECT ${column} AS media_id FROM custom_profiles WHERE discord_id = ? FOR UPDATE`,
      [ownerId],
    );
    oldId = profiles[0]?.media_id || null;
    await connection.query(
      `UPDATE custom_profiles SET ${column} = ? WHERE discord_id = ?`,
      [mediaId, ownerId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  if (oldId && oldId !== mediaId) await deleteOwnedMedia(ownerId, oldId);
}

export async function clearProfileMedia(ownerId: string, purpose: "avatar" | "banner") {
  const column = purpose === "avatar" ? "avatar_media_id" : "banner_media_id";
  const pool = getPool();
  const connection = await pool.getConnection();
  let oldId: string | null = null;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<Array<RowDataPacket & { media_id: string | null }>>(
      `SELECT ${column} AS media_id FROM custom_profiles WHERE discord_id = ? FOR UPDATE`,
      [ownerId],
    );
    oldId = rows[0]?.media_id || null;
    if (oldId) await connection.query(`UPDATE custom_profiles SET ${column} = NULL WHERE discord_id = ?`, [ownerId]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  if (oldId) await deleteOwnedMedia(ownerId, oldId);
}

export async function deleteOwnedMedia(ownerId: string, id: string) {
  const pool = getPool();
  const connection = await pool.getConnection();
  let record: MediaRecord | null = null;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query<MediaRecord[]>(
      "SELECT * FROM media_assets WHERE id = ? AND owner_id = ? FOR UPDATE",
      [id, ownerId],
    );
    record = rows[0] || null;
    if (record) {
      await connection.query("DELETE FROM media_assets WHERE id = ? AND owner_id = ?", [id, ownerId]);
      await connection.query(
        "UPDATE community_users SET used_bytes = GREATEST(0, used_bytes - ?) WHERE discord_id = ?",
        [record.encrypted_bytes, ownerId],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  if (record) await removeEncrypted(record.storage_path);
  return Boolean(record);
}

async function releaseReservedAsset(id: string, ownerId: string, bytes: number, relativePath: string) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM media_assets WHERE id = ? AND owner_id = ?",
      [id, ownerId],
    );
    if (result.affectedRows) {
      await connection.query(
        "UPDATE community_users SET used_bytes = GREATEST(0, used_bytes - ?) WHERE discord_id = ?",
        [bytes, ownerId],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("No se pudo liberar una reserva de medio", error);
  } finally {
    connection.release();
    await removeEncrypted(relativePath).catch(() => undefined);
  }
}

export async function getBannerColor(userId: string) {
  await ensureMigrations();
  const [rows] = await getPool().query<Array<RowDataPacket & { banner_color: string | null }>>(
    "SELECT banner_color FROM custom_profiles WHERE discord_id = ?",
    [userId],
  );
  return normalizeBannerColor(rows[0]?.banner_color);
}

export async function getBannerColorsBatch(userIds: string[]) {
  if (!userIds.length) return new Map<string, string | null>();
  await ensureMigrations();
  const uniqueIds = [...new Set(userIds)];
  const placeholders = uniqueIds.map(() => "?").join(",");
  const [rows] = await getPool().query<Array<RowDataPacket & {
    discord_id: string;
    banner_color: string | null;
  }>>(
    `SELECT discord_id, banner_color
     FROM custom_profiles WHERE discord_id IN (${placeholders})`,
    uniqueIds,
  );
  return new Map(rows.map((row) => [row.discord_id, normalizeBannerColor(row.banner_color)]));
}

export async function setBannerColor(userId: string, color: string | null) {
  const bannerColor = normalizeBannerColor(color);
  await ensureMigrations();
  const pool = getPool();
  await pool.query("INSERT IGNORE INTO community_users (discord_id) VALUES (?)", [userId]);
  await pool.query(
    `INSERT INTO custom_profiles (discord_id, banner_color)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE banner_color = VALUES(banner_color)`,
    [userId, bannerColor],
  );
  return bannerColor;
}

function normalizeBannerColor(value: string | null | undefined) {
  if (!value) return null;
  const match = String(value).trim().match(/^#([0-9A-Fa-f]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : null;
}

export async function getQuota(userId: string) {
  await ensureMigrations();
  await getPool().query("INSERT IGNORE INTO community_users (discord_id) VALUES (?)", [userId]);
  const [rows] = await getPool().query<Array<RowDataPacket & { used_bytes: number; quota_bytes: number }>>(
    "SELECT used_bytes, quota_bytes FROM community_users WHERE discord_id = ?",
    [userId],
  );
  return { usedBytes: Number(rows[0].used_bytes), quotaBytes: Number(rows[0].quota_bytes) };
}

export async function cleanupAbandonedMedia() {
  await ensureMigrations();
  const [rows] = await getPool().query<MediaRecord[]>(
    `SELECT * FROM media_assets
     WHERE status = 'pending' AND created_at < (UTC_TIMESTAMP() - INTERVAL 1 HOUR)
     LIMIT 100`,
  );
  await Promise.all(rows.map((row) => deleteOwnedMedia(row.owner_id, row.id)));
  await cleanupTemporaryFiles();
  return rows.length;
}
