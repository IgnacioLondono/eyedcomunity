import { accessErrorResponse, requireCommunityViewer } from "@/lib/community-auth";
import { buildCommunitySignedHeaders, getEyedBotUrl } from "@/lib/eyedbot-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ characterId: string }> },
) {
  try {
    const { userId } = await requireCommunityViewer();
    const { characterId } = await context.params;
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(characterId)) {
      return Response.json({ error: "Personaje inválido" }, { status: 400 });
    }
    const path = `/api/community/gacha-catalog-image/${encodeURIComponent(characterId)}`;
    const signed = buildCommunitySignedHeaders({ method: "GET", path, userId });
    const upstream = await fetch(getEyedBotUrl(path), {
      headers: { ...signed, Accept: "image/*" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      return Response.json({ error: "Imagen no disponible" }, { status: upstream.status === 404 ? 404 : 502 });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/png",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return accessErrorResponse(error);
  }
}
