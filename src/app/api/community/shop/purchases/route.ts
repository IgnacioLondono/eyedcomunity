import { z } from "zod";
import { bffMutation } from "@/lib/community-bff";
import { purchaseCommunityShopProduct } from "@/lib/eyedbot-api";

const purchaseSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
});

export async function POST(request: Request) {
  return bffMutation(request, purchaseSchema, (userId, input) => (
    purchaseCommunityShopProduct(userId, input)
  ));
}
