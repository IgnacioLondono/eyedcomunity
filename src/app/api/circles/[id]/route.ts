import { z } from "zod";
import { accessErrorResponse, assertSameOrigin, requireCommunityViewer } from "@/lib/community-auth";
import { CirclePermissionError, deleteCircle, leaveCircle } from "@/lib/circle-store";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const idSchema = z.string().uuid();

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { userId } = await requireCommunityViewer({ mutation: true });
    enforceRateLimit(`circle-delete:${userId}`, 20, 60 * 60 * 1000);
    const circleId = idSchema.parse((await context.params).id);
    const intent = new URL(request.url).searchParams.get("action") === "leave" ? "leave" : "delete";
    const ok = intent === "leave"
      ? await leaveCircle(userId, circleId)
      : await deleteCircle(userId, circleId);
    if (!ok) return Response.json({ error: "Círculo no encontrado" }, { status: 404 });
    return Response.json({ ok: true, action: intent });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof z.ZodError) return Response.json({ error: "Círculo inválido" }, { status: 400 });
    if (error instanceof CirclePermissionError) return Response.json({ error: error.message }, { status: 403 });
    return accessErrorResponse(error);
  }
}
