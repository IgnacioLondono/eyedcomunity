import "server-only";

import { auth } from "@/auth";
import { IS_DEMO_MODE } from "./demo";

const membershipCache = new Map<string, { valid: boolean; expiresAt: number }>();
const MEMBERSHIP_TTL_MS = 2 * 60 * 1000;

export class ApiAccessError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function requireCommunityViewer(options: { mutation?: boolean } = {}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    if (IS_DEMO_MODE && options.mutation) {
      throw new ApiAccessError("Las modificaciones están desactivadas en la demo", 403);
    }
    throw new ApiAccessError("Debes iniciar sesión", 401);
  }
  if (options.mutation && IS_DEMO_MODE) {
    throw new ApiAccessError("Las modificaciones están desactivadas en la demo", 403);
  }
  await assertCurrentMember(userId);
  return { userId, session };
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configuredOrigin = process.env.AUTH_URL
    ? new URL(process.env.AUTH_URL).origin
    : new URL(request.url).origin;
  if (!origin || origin !== configuredOrigin) {
    throw new ApiAccessError("Origen de solicitud no permitido", 403);
  }
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

  const baseUrl = process.env.EYEDBOT_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.COMMUNITY_API_KEY || process.env.EYEDBOT_API_KEY;
  if (!baseUrl || !apiKey) throw new ApiAccessError("EyedBot no está configurado", 503);

  const response = await fetch(
    `${baseUrl}/api/community/membership/${encodeURIComponent(userId)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    },
  ).catch(() => null);
  const valid = response?.ok === true;
  membershipCache.set(userId, { valid, expiresAt: Date.now() + MEMBERSHIP_TTL_MS });
  if (!response) throw new ApiAccessError("No se pudo verificar la membresía", 503);
  if (!valid) throw new ApiAccessError("Ya no perteneces al servidor", response.status === 404 ? 403 : response.status);
}

export function accessErrorResponse(error: unknown) {
  if (error instanceof ApiAccessError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Error interno" }, { status: 500 });
}
