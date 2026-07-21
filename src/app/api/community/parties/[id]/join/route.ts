import { z } from "zod";
import { bffMutation } from "@/lib/community-bff";
import { joinCommunityParty, leaveCommunityParty } from "@/lib/eyedbot-api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return bffMutation(request, z.object({}).strict(), (userId) => joinCommunityParty(userId, id));
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return bffMutation(request, z.object({}).strict(), (userId) => leaveCommunityParty(userId, id));
}
