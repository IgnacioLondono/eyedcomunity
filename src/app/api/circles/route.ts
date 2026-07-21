import { z } from "zod";
import { accessErrorResponse, assertSameOrigin, requireCommunityViewer } from "@/lib/community-auth";
import { createCircle, listCirclePosts, listCircles } from "@/lib/circle-store";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(240).optional(),
});

export async function GET() {
  try {
    const { userId } = await requireCommunityViewer();
    const [circles, posts] = await Promise.all([listCircles(userId), listCirclePosts(userId)]);
    return Response.json({ circles, posts });
  } catch (error) {
    return accessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { userId, session } = await requireCommunityViewer({ mutation: true });
    enforceRateLimit(`circle-create:${userId}`, 10, 60 * 60 * 1000);
    const input = createSchema.parse(await request.json());
    const circle = await createCircle(userId, session.user?.name || null, input.name, input.description);
    return Response.json({ circle }, { status: 201 });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof z.ZodError) return Response.json({ error: "Datos del círculo inválidos" }, { status: 400 });
    return accessErrorResponse(error);
  }
}
