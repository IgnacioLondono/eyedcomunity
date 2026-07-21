import "server-only";

import { auth } from "@/auth";
import { ApiAccessError, assertSameOrigin } from "./bff-guards";
import { buildCommunitySignedHeaders, getEyedBotUrl } from "./eyedbot-api";
import { membershipCacheValue } from "./membership-cache";

const membershipCache = new Map<string, { valid: boolean; expiresAt: number }>();
const MEMBERSHIP_TTL_MS = 2 * 60 * 1000;

export { ApiAccessError, assertSameOrigin };

export async function requireCommunityViewer(options: { mutation?: boolean } = {}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new ApiAccessError("Debes iniciar sesión", 401);
  }
  if (options.mutation && !/^\d{10,25}$/.test(userId)) {
    throw new ApiAccessError("La identidad de sesión no es válida", 401);
  }
  await assertCurrentMember(userId);
  return { userId, session };
}

export function assertUploadEnvelope(request: Request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > 9 * 1024 * 1024) {
    throw new ApiAccessError("La solicitud supera el límite permitido", 413);
  }
}

export async function assertCurrentMember(userId: string) {
  const cached = membershipCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    if (!cached.valid) throw new ApiAccessError("Ya no perteneces al servidor", 403);
    return;
  }

  const path = `/api/community/membership/${encodeURIComponent(userId)}`;
  let url: string;
  let headers: HeadersInit;
  try {
    url = getEyedBotUrl(path);
    headers = { ...buildCommunitySignedHeaders({ method: "GET", path, userId }), Accept: "application/json" };
  } catch {
    throw new ApiAccessError("EyedBot no está configurado", 503);
  }

  const response = await fetch(
    url,
    {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    },
  ).catch(() => null);
  if (!response) throw new ApiAccessError("No se pudo verificar la membresía", 503);
  const cacheValue = membershipCacheValue(response.status);
  if (cacheValue !== null) {
    membershipCache.set(userId, { valid: cacheValue, expiresAt: Date.now() + MEMBERSHIP_TTL_MS });
  }
  if (!response.ok) {
    if (cacheValue === false) throw new ApiAccessError("Ya no perteneces al servidor", 403);
    if (response.status === 429) throw new ApiAccessError("La verificación está temporalmente limitada", 429);
    throw new ApiAccessError("No se pudo verificar la membresía", response.status >= 500 ? 503 : response.status);
  }
}

export function accessErrorResponse(error: unknown) {
  if (error instanceof ApiAccessError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Error interno" }, { status: 500 });
}
