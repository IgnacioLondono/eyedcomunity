import { z } from "zod";
import { accessErrorResponse, assertSameOrigin, assertUploadEnvelope, requireCommunityViewer } from "@/lib/community-auth";
import {
  CirclePermissionError,
  createCirclePost,
  listCirclePosts,
  upsertCommunityUser,
} from "@/lib/circle-store";
import {
  createEncryptedMedia,
  deleteOwnedMedia,
  QuotaExceededError,
} from "@/lib/media/service";
import { MediaValidationError } from "@/lib/media/transform";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();
const contentSchema = z.string().trim().max(2_000);

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireCommunityViewer();
    const circleId = idSchema.parse((await context.params).id);
    return Response.json({ posts: await listCirclePosts(userId, circleId) });
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({ error: "Círculo inválido" }, { status: 400 });
    return accessErrorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  let mediaId: string | null = null;
  let userId: string | null = null;
  try {
    assertSameOrigin(request);
    assertUploadEnvelope(request);
    const viewer = await requireCommunityViewer({ mutation: true });
    userId = viewer.userId;
    enforceRateLimit(`circle-post:${userId}`, 20, 10 * 60 * 1000);
    const circleId = idSchema.parse((await context.params).id);
    const form = await request.formData();
    const content = contentSchema.parse(String(form.get("content") || ""));
    const file = form.get("file");
    if (!content && !(file instanceof File && file.size > 0)) {
      return Response.json({ error: "Escribe algo o añade una imagen" }, { status: 400 });
    }
    await upsertCommunityUser(userId, viewer.session.user?.name);
    if (file instanceof File && file.size > 0) {
      const media = await createEncryptedMedia(userId, "circle", file);
      mediaId = media.id;
    }
    const postId = await createCirclePost(userId, circleId, content, mediaId);
    return Response.json({ id: postId }, { status: 201 });
  } catch (error) {
    if (mediaId && userId) await deleteOwnedMedia(userId, mediaId).catch(() => undefined);
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof z.ZodError || error instanceof MediaValidationError) {
      return Response.json(
        { error: error instanceof MediaValidationError ? error.message : "Publicación inválida" },
        { status: 400 },
      );
    }
    if (error instanceof QuotaExceededError) return Response.json({ error: error.message }, { status: 413 });
    if (error instanceof CirclePermissionError) return Response.json({ error: error.message }, { status: 403 });
    return accessErrorResponse(error);
  }
}
