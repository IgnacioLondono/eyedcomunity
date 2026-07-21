import { z } from "zod";
import { bffMutation } from "@/lib/community-bff";
import { mutateCommunityPlan } from "@/lib/eyedbot-api";

const empty = z.object({}).strict();

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return bffMutation(request, empty, (userId) => mutateCommunityPlan(userId, id, "join"));
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return bffMutation(request, empty, (userId) => mutateCommunityPlan(userId, id, "leave"));
}
