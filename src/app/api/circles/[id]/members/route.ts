import { z } from "zod";
import { accessErrorResponse, assertCurrentMember, assertSameOrigin, requireCommunityViewer } from "@/lib/community-auth";
import { addCircleMember, CirclePermissionError } from "@/lib/circle-store";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const idSchema = z.string().uuid();
const memberSchema = z.object({ userId: z.string().regex(/^\d{10,25}$/) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { userId } = await requireCommunityViewer({ mutation: true });
    enforceRateLimit(`circle-member:${userId}`, 30, 60 * 60 * 1000);
    const circleId = idSchema.parse((await context.params).id);
    const input = memberSchema.parse(await request.json());
    await assertCurrentMember(input.userId);
    await addCircleMember(userId, circleId, input.userId);
    return Response.json({ ok: true });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof z.ZodError) return Response.json({ error: "Miembro o círculo inválido" }, { status: 400 });
    if (error instanceof CirclePermissionError) return Response.json({ error: error.message }, { status: 403 });
    return accessErrorResponse(error);
  }
}
