import { z } from "zod";
import { bffMutation } from "@/lib/community-bff";
import { inviteCommunityPlan } from "@/lib/eyedbot-api";

const input = z.object({ userId: z.string().regex(/^\d{10,25}$/) }).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return bffMutation(request, input, (userId, body) => inviteCommunityPlan(userId, id, body.userId));
}
