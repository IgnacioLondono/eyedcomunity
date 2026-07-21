import { z } from "zod";
import { bffMutation } from "@/lib/community-bff";
import { createCommunityParty } from "@/lib/eyedbot-api";

const input = z.object({
  title: z.string().trim().min(3).max(100),
  gameType: z.enum(["trivia", "dice"]),
  capacity: z.number().int().min(2).max(20).default(8),
}).strict();

export function POST(request: Request) {
  return bffMutation(request, input, createCommunityParty);
}
