import { z } from "zod";
import { createCommunityPlan } from "@/lib/eyedbot-api";
import { bffMutation } from "@/lib/community-bff";

const planInput = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).default(""),
  location: z.string().trim().max(200).default(""),
  capacity: z.number().int().min(2).max(500),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable().optional(),
  status: z.enum(["upcoming", "active"]).default("upcoming"),
  visibility: z.enum(["guild", "private"]).default("guild"),
}).strict();

export function POST(request: Request) {
  return bffMutation(request, planInput, createCommunityPlan);
}
