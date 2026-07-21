import "server-only";

import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { ensureMigrations, getPool } from "@/lib/db";
import { deleteOwnedMedia } from "@/lib/media/service";

export interface CircleSummary extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: string;
  memberCount: number;
}

export interface CirclePost extends RowDataPacket {
  id: string;
  circleId: string;
  circleName: string;
  authorId: string;
  authorName: string;
  authorAvatarId: string | null;
  content: string;
  mediaId: string | null;
  createdAt: Date;
}

export async function upsertCommunityUser(userId: string, displayName?: string | null) {
  await ensureMigrations();
  await getPool().query(
    `INSERT INTO community_users (discord_id, display_name) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE display_name = COALESCE(VALUES(display_name), display_name)`,
    [userId, displayName?.slice(0, 80) || null],
  );
}

export async function listCircles(userId: string) {
  await ensureMigrations();
  const [rows] = await getPool().query<CircleSummary[]>(
    `SELECT c.id, c.name, c.description, c.owner_id AS ownerId, cm.role,
      (SELECT COUNT(*) FROM circle_members total WHERE total.circle_id = c.id) AS memberCount
     FROM circles c
     INNER JOIN circle_members cm ON cm.circle_id = c.id
     WHERE cm.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({ ...row, memberCount: Number(row.memberCount) }));
}

export async function createCircle(userId: string, displayName: string | null, name: string, description?: string) {
  const id = randomUUID();
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO community_users (discord_id, display_name) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE display_name = COALESCE(VALUES(display_name), display_name)`,
      [userId, displayName?.slice(0, 80) || null],
    );
    await connection.query(
      "INSERT INTO circles (id, owner_id, name, description) VALUES (?, ?, ?, ?)",
      [id, userId, name, description || null],
    );
    await connection.query(
      "INSERT INTO circle_members (circle_id, user_id, role) VALUES (?, ?, 'owner')",
      [id, userId],
    );
    await connection.commit();
    return { id, name, description: description || null, ownerId: userId, role: "owner", memberCount: 1 };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function addCircleMember(ownerId: string, circleId: string, memberId: string) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [circles] = await connection.query<Array<RowDataPacket & { owner_id: string }>>(
      "SELECT owner_id FROM circles WHERE id = ? FOR UPDATE",
      [circleId],
    );
    if (circles[0]?.owner_id !== ownerId) throw new CirclePermissionError();
    await connection.query("INSERT IGNORE INTO community_users (discord_id) VALUES (?)", [memberId]);
    await connection.query(
      "INSERT IGNORE INTO circle_members (circle_id, user_id, role) VALUES (?, ?, 'member')",
      [circleId, memberId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listCircleMembers(viewerId: string, circleId: string) {
  await ensureMigrations();
  const [membership] = await getPool().query<Array<RowDataPacket>>(
    "SELECT 1 AS ok FROM circle_members WHERE circle_id = ? AND user_id = ? LIMIT 1",
    [circleId, viewerId],
  );
  if (!membership[0]) throw new CirclePermissionError();
  const [rows] = await getPool().query<Array<RowDataPacket & {
    userId: string;
    role: string;
    displayName: string | null;
    joinedAt: Date;
  }>>(
    `SELECT cm.user_id AS userId, cm.role, COALESCE(u.display_name, cm.user_id) AS displayName, cm.joined_at AS joinedAt
     FROM circle_members cm
     LEFT JOIN community_users u ON u.discord_id = cm.user_id
     WHERE cm.circle_id = ?
     ORDER BY cm.role = 'owner' DESC, cm.joined_at ASC`,
    [circleId],
  );
  return rows.map((row) => ({
    userId: String(row.userId),
    role: String(row.role),
    displayName: String(row.displayName || row.userId),
    joinedAt: new Date(row.joinedAt).toISOString(),
  }));
}

export async function listCirclePosts(userId: string, circleId?: string | null) {
  await ensureMigrations();
  const params: string[] = [userId];
  const circleFilter = circleId ? "AND p.circle_id = ?" : "";
  if (circleId) params.push(circleId);
  const [rows] = await getPool().query<CirclePost[]>(
    `SELECT p.id, p.circle_id AS circleId, c.name AS circleName,
       p.author_id AS authorId, COALESCE(u.display_name, p.author_id) AS authorName,
       cp.avatar_media_id AS authorAvatarId, p.content, pm.media_id AS mediaId,
       p.created_at AS createdAt
     FROM circle_posts p
     INNER JOIN circles c ON c.id = p.circle_id
     INNER JOIN circle_members viewer ON viewer.circle_id = p.circle_id AND viewer.user_id = ?
     LEFT JOIN community_users u ON u.discord_id = p.author_id
     LEFT JOIN custom_profiles cp ON cp.discord_id = p.author_id
     LEFT JOIN circle_post_media pm ON pm.post_id = p.id
     WHERE 1 = 1 ${circleFilter}
     ORDER BY p.created_at DESC
     LIMIT 100`,
    params,
  );
  return rows;
}

export async function createCirclePost(
  authorId: string,
  circleId: string,
  content: string,
  mediaId?: string | null,
) {
  const id = randomUUID();
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [membership] = await connection.query<Array<RowDataPacket & { allowed: number }>>(
      "SELECT 1 AS allowed FROM circle_members WHERE circle_id = ? AND user_id = ? FOR UPDATE",
      [circleId, authorId],
    );
    if (!membership[0]) throw new CirclePermissionError();
    if (mediaId) {
      const [assets] = await connection.query<Array<RowDataPacket & { allowed: number }>>(
        `SELECT 1 AS allowed FROM media_assets
         WHERE id = ? AND owner_id = ? AND purpose = 'circle' AND status = 'ready' FOR UPDATE`,
        [mediaId, authorId],
      );
      if (!assets[0]) throw new CirclePermissionError("Archivo adjunto inválido");
    }
    await connection.query(
      "INSERT INTO circle_posts (id, circle_id, author_id, content) VALUES (?, ?, ?, ?)",
      [id, circleId, authorId, content],
    );
    if (mediaId) {
      await connection.query(
        "INSERT INTO circle_post_media (post_id, media_id) VALUES (?, ?)",
        [id, mediaId],
      );
    }
    await connection.commit();
    return id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteCirclePost(authorId: string, postId: string) {
  const pool = getPool();
  const connection = await pool.getConnection();
  let mediaIds: string[] = [];
  try {
    await connection.beginTransaction();
    const [posts] = await connection.query<Array<RowDataPacket & { author_id: string }>>(
      "SELECT author_id FROM circle_posts WHERE id = ? FOR UPDATE",
      [postId],
    );
    if (!posts[0]) {
      await connection.rollback();
      return false;
    }
    if (posts[0].author_id !== authorId) throw new CirclePermissionError();
    const [media] = await connection.query<Array<RowDataPacket & { media_id: string }>>(
      "SELECT media_id FROM circle_post_media WHERE post_id = ?",
      [postId],
    );
    mediaIds = media.map((row) => row.media_id);
    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM circle_posts WHERE id = ? AND author_id = ?",
      [postId, authorId],
    );
    await connection.commit();
    if (!result.affectedRows) return false;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await Promise.all(mediaIds.map((id) => deleteOwnedMedia(authorId, id)));
  return true;
}

export async function deleteCircle(ownerId: string, circleId: string) {
  const pool = getPool();
  const connection = await pool.getConnection();
  let mediaRows: Array<{ id: string; ownerId: string }> = [];
  try {
    await connection.beginTransaction();
    const [circles] = await connection.query<Array<RowDataPacket & { owner_id: string }>>(
      "SELECT owner_id FROM circles WHERE id = ? FOR UPDATE",
      [circleId],
    );
    if (!circles[0]) {
      await connection.rollback();
      return false;
    }
    if (circles[0].owner_id !== ownerId) throw new CirclePermissionError();
    const [media] = await connection.query<Array<RowDataPacket & { media_id: string; owner_id: string }>>(
      `SELECT pm.media_id, m.owner_id
       FROM circle_posts p
       INNER JOIN circle_post_media pm ON pm.post_id = p.id
       INNER JOIN media_assets m ON m.id = pm.media_id
       WHERE p.circle_id = ?`,
      [circleId],
    );
    mediaRows = media.map((row) => ({ id: row.media_id, ownerId: row.owner_id }));
    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM circles WHERE id = ? AND owner_id = ?",
      [circleId, ownerId],
    );
    await connection.commit();
    if (!result.affectedRows) return false;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  await Promise.all(mediaRows.map((row) => deleteOwnedMedia(row.ownerId, row.id).catch(() => undefined)));
  return true;
}

export async function leaveCircle(userId: string, circleId: string) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [circles] = await connection.query<Array<RowDataPacket & { owner_id: string }>>(
      "SELECT owner_id FROM circles WHERE id = ? FOR UPDATE",
      [circleId],
    );
    if (!circles[0]) {
      await connection.rollback();
      return false;
    }
    if (circles[0].owner_id === userId) {
      throw new CirclePermissionError("El dueño debe eliminar el círculo");
    }
    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM circle_members WHERE circle_id = ? AND user_id = ?",
      [circleId, userId],
    );
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function removeCircleMember(ownerId: string, circleId: string, memberId: string) {
  if (ownerId === memberId) throw new CirclePermissionError("No puedes eliminarte a ti mismo como dueño");
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [circles] = await connection.query<Array<RowDataPacket & { owner_id: string }>>(
      "SELECT owner_id FROM circles WHERE id = ? FOR UPDATE",
      [circleId],
    );
    if (!circles[0]) {
      await connection.rollback();
      return false;
    }
    if (circles[0].owner_id !== ownerId) throw new CirclePermissionError();
    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM circle_members WHERE circle_id = ? AND user_id = ? AND role <> 'owner'",
      [circleId, memberId],
    );
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export class CirclePermissionError extends Error {
  constructor(message = "No tienes permiso para esta acción") {
    super(message);
  }
}
