import { z } from "zod";
import { bffMutation } from "@/lib/community-bff";
import { updateCommunitySettings } from "@/lib/eyedbot-api";

const featureKey = z.enum([
  "activity", "achievements", "wrapped", "server", "lobby",
  "ranking", "circle", "plans", "party", "challenges",
]);

const patchSchema = z.object({
  maintenance: z.boolean().optional(),
  achievementNotifications: z.boolean().optional(),
  features: z.partialRecord(featureKey, z.boolean()).optional(),
}).refine(
  (value) => value.maintenance !== undefined
    || value.achievementNotifications !== undefined
    || value.features !== undefined,
  "No hay cambios",
);

export async function PATCH(request: Request) {
  return bffMutation(request, patchSchema, (userId, input) => (
    updateCommunitySettings(userId, input)
  ));
}
