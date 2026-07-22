import { bffErrorResponse } from "@/lib/community-bff";
import { requireCommunityViewer } from "@/lib/community-auth";
import { buildCommunitySignedHeaders, getEyedBotUrl } from "@/lib/eyedbot-api";
import { isAbortLike, safeProxyBody } from "@/lib/upstream-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { userId } = await requireCommunityViewer();
    const lastEventId = request.headers.get("last-event-id");
    const path = "/api/community/events";

    let upstream: Response;
    try {
      upstream = await fetch(getEyedBotUrl(path), {
        headers: {
          ...buildCommunitySignedHeaders({ method: "GET", path, userId }),
          Accept: "text/event-stream",
          ...(lastEventId ? { "Last-Event-ID": lastEventId } : {}),
        },
        cache: "no-store",
        signal: request.signal,
      });
    } catch (error) {
      if (request.signal.aborted || isAbortLike(error)) {
        return new Response(null, { status: 204 });
      }
      console.error("[community-events] no se pudo abrir upstream", error);
      return Response.json(
        { error: "EyedBot no está disponible para eventos en vivo" },
        { status: 502 },
      );
    }

    if (!upstream.ok || !upstream.body) {
      const body = await upstream.json().catch(() => null) as {
        error?: { message?: string };
      } | null;
      return Response.json(
        { error: body?.error?.message || "No se pudo abrir el stream comunitario" },
        { status: upstream.status || 502 },
      );
    }

    return new Response(safeProxyBody(upstream.body, request.signal), {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    if (request.signal.aborted || isAbortLike(error)) {
      return new Response(null, { status: 204 });
    }
    return bffErrorResponse(error);
  }
}
