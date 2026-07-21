import { z } from "zod";
import { accessErrorResponse, assertSameOrigin, requireCommunityViewer } from "@/lib/community-auth";
import { canViewMedia } from "@/lib/media/acl";
import { decryptMediaRecord, deleteOwnedMedia, getMediaRecord } from "@/lib/media/service";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireCommunityViewer();
    const id = idSchema.parse((await context.params).id);
    const media = await getMediaRecord(id);
    if (!media || !(await canViewMedia(userId, media))) {
      return Response.json({ error: "Medio no encontrado" }, { status: 404 });
    }
    const plaintext = await decryptMediaRecord(media);
    return new Response(new Uint8Array(plaintext), {
      headers: {
        "Content-Type": media.mime_type,
        "Content-Length": String(plaintext.length),
        "Cache-Control": "private, max-age=300, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "ID inválido" }, { status: 400 });
    return accessErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { userId } = await requireCommunityViewer({ mutation: true });
    enforceRateLimit(`media-delete:${userId}`, 30, 10 * 60 * 1000);
    const id = idSchema.parse((await context.params).id);
    const deleted = await deleteOwnedMedia(userId, id);
    return deleted
      ? Response.json({ ok: true })
      : Response.json({ error: "Medio no encontrado" }, { status: 404 });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof z.ZodError) return Response.json({ error: "ID inválido" }, { status: 400 });
    return accessErrorResponse(error);
  }
}
