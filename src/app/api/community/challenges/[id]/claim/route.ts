import { z } from "zod";
import { claimCommunityChallenge } from "@/lib/eyedbot-api";
import { bffMutation } from "@/lib/community-bff";

const inputSchema = z.object({}).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return bffMutation(request, inputSchema, (userId) => claimCommunityChallenge(userId, id));
}
