import "server-only";

import type { RowDataPacket } from "mysql2";
import { getPool } from "@/lib/db";
import type { MediaRecord } from "./service";

export async function canViewMedia(viewerId: string, media: MediaRecord) {
  if (media.owner_id === viewerId) return true;
  if (media.purpose === "avatar" || media.purpose === "banner") return true;
  if (media.purpose !== "circle") return false;

  const [rows] = await getPool().query<Array<RowDataPacket & { allowed: number }>>(
    `SELECT 1 AS allowed
     FROM circle_post_media pm
     INNER JOIN circle_posts p ON p.id = pm.post_id
     INNER JOIN circle_members cm ON cm.circle_id = p.circle_id
     WHERE pm.media_id = ? AND cm.user_id = ?
     LIMIT 1`,
    [media.id, viewerId],
  );
  return Boolean(rows[0]?.allowed);
}
