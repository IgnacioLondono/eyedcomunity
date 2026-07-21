import { z } from "zod";
import { bffMutation } from "@/lib/community-bff";
import { mutateCommunityPlan } from "@/lib/eyedbot-api";

const input = z.object({
  status: z.enum(["upcoming", "active", "completed", "cancelled"]),
}).strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return bffMutation(request, input, (userId, body) => mutateCommunityPlan(userId, id, "status", body.status));
}
