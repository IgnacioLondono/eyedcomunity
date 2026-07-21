import { z } from "zod";
import { accessErrorResponse, assertSameOrigin, requireCommunityViewer } from "@/lib/community-auth";
import { CirclePermissionError, deleteCirclePost } from "@/lib/circle-store";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const idSchema = z.string().uuid();

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { userId } = await requireCommunityViewer({ mutation: true });
    enforceRateLimit(`post-delete:${userId}`, 30, 10 * 60 * 1000);
    const postId = idSchema.parse((await context.params).id);
    const deleted = await deleteCirclePost(userId, postId);
    return deleted
      ? Response.json({ ok: true })
      : Response.json({ error: "Publicación no encontrada" }, { status: 404 });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof z.ZodError) return Response.json({ error: "Publicación inválida" }, { status: 400 });
    if (error instanceof CirclePermissionError) return Response.json({ error: error.message }, { status: 403 });
    return accessErrorResponse(error);
  }
}
