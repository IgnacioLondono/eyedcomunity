import "server-only";

import { z } from "zod";
import {
  accessErrorResponse,
  assertSameOrigin,
  requireCommunityViewer,
} from "./community-auth";
import { EyedBotApiError } from "./eyedbot-api";

export async function bffMutation<T>(
  request: Request,
  schema: z.ZodType<T>,
  operation: (userId: string, input: T) => Promise<unknown>,
) {
  try {
    assertSameOrigin(request);
    const { userId } = await requireCommunityViewer({ mutation: true });
    const input = schema.parse(await request.json().catch(() => ({})));
    return Response.json(await operation(userId, input));
  } catch (error) {
    return bffErrorResponse(error);
  }
}

export function bffErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    return Response.json({ error: "Solicitud inválida", issues: error.issues }, { status: 400 });
  }
  if (error instanceof EyedBotApiError) {
    return Response.json(
      { error: error.message, code: error.code, requestId: error.requestId },
      { status: error.status },
    );
  }
  return accessErrorResponse(error);
}
