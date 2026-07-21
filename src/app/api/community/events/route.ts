import { bffErrorResponse } from "@/lib/community-bff";
import { requireCommunityViewer } from "@/lib/community-auth";
import { buildCommunitySignedHeaders, getEyedBotUrl } from "@/lib/eyedbot-api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { userId } = await requireCommunityViewer();
    const lastEventId = request.headers.get("last-event-id");
    const path = "/api/community/events";
    const upstream = await fetch(getEyedBotUrl(path), {
      headers: {
        ...buildCommunitySignedHeaders({ method: "GET", path, userId }),
        Accept: "text/event-stream",
        ...(lastEventId ? { "Last-Event-ID": lastEventId } : {}),
      },
      cache: "no-store",
      signal: request.signal,
    });
    if (!upstream.ok || !upstream.body) {
      const body = await upstream.json().catch(() => null) as {
        error?: { message?: string };
      } | null;
      return Response.json(
        { error: body?.error?.message || "No se pudo abrir el stream comunitario" },
        { status: upstream.status },
      );
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return bffErrorResponse(error);
  }
}
