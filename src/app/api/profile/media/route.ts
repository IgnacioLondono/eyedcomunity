import { z } from "zod";
import { accessErrorResponse, assertSameOrigin, assertUploadEnvelope, requireCommunityViewer } from "@/lib/community-auth";
import {
  clearProfileMedia,
  createEncryptedMedia,
  deleteOwnedMedia,
  getProfileMedia,
  getQuota,
  QuotaExceededError,
  setProfileMedia,
} from "@/lib/media/service";
import { MediaValidationError } from "@/lib/media/transform";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const purposeSchema = z.enum(["avatar", "banner"]);

export async function GET() {
  try {
    const { userId } = await requireCommunityViewer();
    const [profile, quota] = await Promise.all([getProfileMedia(userId), getQuota(userId)]);
    return Response.json({ ...profile, quota });
  } catch (error) {
    return accessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let createdId: string | null = null;
  let userId: string | null = null;
  try {
    assertSameOrigin(request);
    assertUploadEnvelope(request);
    ({ userId } = await requireCommunityViewer({ mutation: true }));
    enforceRateLimit(`media-upload:${userId}`, 10, 10 * 60 * 1000);
    const form = await request.formData();
    const purpose = purposeSchema.parse(form.get("purpose"));
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Debes seleccionar una imagen" }, { status: 400 });
    }
    const media = await createEncryptedMedia(userId, purpose, file);
    createdId = media.id;
    await setProfileMedia(userId, purpose, media.id);
    const quota = await getQuota(userId);
    return Response.json({ media, quota }, { status: 201 });
  } catch (error) {
    if (createdId && userId) await deleteOwnedMedia(userId, createdId).catch(() => undefined);
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof z.ZodError || error instanceof MediaValidationError) {
      return Response.json(
        { error: error instanceof MediaValidationError ? error.message : "Tipo de imagen inválido" },
        { status: 400 },
      );
    }
    if (error instanceof QuotaExceededError) return Response.json({ error: error.message }, { status: 413 });
    return accessErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const { userId } = await requireCommunityViewer({ mutation: true });
    enforceRateLimit(`profile-media-delete:${userId}`, 20, 10 * 60 * 1000);
    const purpose = purposeSchema.parse((await request.json()).purpose);
    await clearProfileMedia(userId, purpose);
    return Response.json({ ok: true, quota: await getQuota(userId) });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof z.ZodError) return Response.json({ error: "Tipo de imagen inválido" }, { status: 400 });
    return accessErrorResponse(error);
  }
}
