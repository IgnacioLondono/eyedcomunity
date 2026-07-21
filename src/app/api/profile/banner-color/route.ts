import { z } from "zod";
import { accessErrorResponse, assertSameOrigin, requireCommunityViewer } from "@/lib/community-auth";
import { getBannerColor, setBannerColor } from "@/lib/media/service";
import { enforceRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const colorSchema = z.object({
  color: z.union([
    z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    z.null(),
  ]),
});

export async function GET() {
  try {
    const { userId } = await requireCommunityViewer();
    return Response.json({ bannerColor: await getBannerColor(userId) });
  } catch (error) {
    return accessErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const { userId } = await requireCommunityViewer({ mutation: true });
    enforceRateLimit(`banner-color:${userId}`, 30, 10 * 60 * 1000);
    const body = colorSchema.parse(await request.json());
    const bannerColor = await setBannerColor(userId, body.color);
    return Response.json({ bannerColor });
  } catch (error) {
    const limited = rateLimitResponse(error);
    if (limited) return limited;
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Color inválido. Usa un hex #RRGGBB." }, { status: 400 });
    }
    return accessErrorResponse(error);
  }
}
