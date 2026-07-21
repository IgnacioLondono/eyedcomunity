import { z } from "zod";
import { bffMutation } from "@/lib/community-bff";
import { respondCommunityPlanInvitation } from "@/lib/eyedbot-api";

const empty = z.object({}).strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; decision: string }> },
) {
  const { id, decision } = await context.params;
  if (decision !== "accept" && decision !== "reject") {
    return Response.json({ error: "Respuesta inválida" }, { status: 400 });
  }
  return bffMutation(request, empty, (userId) => respondCommunityPlanInvitation(userId, id, decision));
}
