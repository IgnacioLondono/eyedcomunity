import { accessErrorResponse, requireCommunityViewer } from "@/lib/community-auth";
import { buildCommunitySignedHeaders, getEyedBotUrl } from "@/lib/eyedbot-api";
import { isAbortLike } from "@/lib/upstream-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
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
      return Response.json(
        { error: "Imagen no disponible" },
        { status: upstream.status === 404 ? 404 : 502 },
      );
    }
    // Buffer completo: evita UND_ERR_SOCKET al pipear el stream de EyedBot.
    const bytes = await upstream.arrayBuffer();
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/png",
        "Cache-Control": "private, max-age=300",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (error) {
    if (request.signal.aborted || isAbortLike(error)) {
      return new Response(null, { status: 204 });
    }
    return accessErrorResponse(error);
  }
}
