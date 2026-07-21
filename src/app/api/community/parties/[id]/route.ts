import { z } from "zod";
import { bffMutation } from "@/lib/community-bff";
import { deleteCommunityParty } from "@/lib/eyedbot-api";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return bffMutation(request, z.object({}).strict(), (userId) => deleteCommunityParty(userId, id));
}
