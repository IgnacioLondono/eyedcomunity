import { z } from "zod";
import { bffMutation } from "@/lib/community-bff";
import { actCommunityParty } from "@/lib/eyedbot-api";

const input = z.object({
  actionId: z.string().regex(/^[A-Za-z0-9_-]{8,80}$/),
  expectedVersion: z.number().int().positive(),
  type: z.enum(["start", "answer", "roll"]),
  choice: z.number().int().nonnegative().optional(),
}).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return bffMutation(request, input, (userId, action) => actCommunityParty(userId, id, action));
}
