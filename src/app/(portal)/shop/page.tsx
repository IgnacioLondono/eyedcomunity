import { redirect } from "next/navigation";
import { Coins, ShoppingBag } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { ShopClient } from "@/components/shop-client";
import { EyedBotApiError, getCommunityShop } from "@/lib/eyedbot-api";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  let catalog;
  try {
    catalog = await getCommunityShop(session.user.id);
  } catch (error) {
    if (error instanceof EyedBotApiError && ["FEATURE_DISABLED", "SHOP_DISABLED"].includes(error.code)) {
      redirect("/feature-disabled?feature=shop");
    }
    throw error;
  }

  return (
    <>
      <PageHeader
        eyebrow="EyedShop"
        title="Tienda de la comunidad"
        description="Canjea tus EyedCoins por personajes, roles y objetos creados desde EyedBot."
        action={<span className="secondary-button"><Coins size={17} /> {catalog.balance.toLocaleString("es")} EyedCoins</span>}
      />
      {catalog.products.length ? (
        <ShopClient initialCatalog={catalog} />
      ) : (
        <section className="empty-card">
          <ShoppingBag />
          <h2>La tienda está vacía</h2>
          <p>Los administradores todavía no han publicado productos desde EyedBot.</p>
        </section>
      )}
    </>
  );
}
