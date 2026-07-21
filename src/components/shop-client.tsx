"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Coins, Package, Shield, Sparkles } from "lucide-react";
import type { CommunityShopCatalog, CommunityShopProduct } from "@/lib/types";

const typeLabels = {
  character: "Personaje",
  role: "Rol de Discord",
  item: "Objeto virtual",
} as const;

const categoryLabels: Record<string, string> = {
  general: "General",
  personajes: "Personajes",
  roles: "Roles",
  objetos: "Objetos",
  boosts: "Boosts",
  eventos: "Eventos",
  cosmeticos: "Cosméticos",
};

function ProductIcon({ type }: { type: CommunityShopProduct["type"] }) {
  if (type === "role") return <Shield />;
  if (type === "character") return <Sparkles />;
  return <Package />;
}

function labelFor(category: string) {
  return categoryLabels[category] || category.replace(/-/g, " ");
}

function productImage(product: CommunityShopProduct) {
  if (product.imageUrl) return product.imageUrl;
  if (product.source === "gacha" && product.hasCatalogImage && product.sourceId) {
    return `/api/community/shop/images/${encodeURIComponent(product.sourceId)}`;
  }
  return null;
}

export function ShopClient({ initialCatalog }: { initialCatalog: CommunityShopCatalog }) {
  const [products, setProducts] = useState(initialCatalog.products);
  const [balance, setBalance] = useState(initialCatalog.balance);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const requestKeys = useRef<Record<string, string>>({});

  const categories = useMemo(() => {
    const fromProducts = [...new Set(products.map((item) => item.category))];
    return fromProducts.length ? fromProducts : initialCatalog.categories;
  }, [products, initialCatalog.categories]);

  const grouped = useMemo(() => {
    const filtered = selectedCategory === "all"
      ? products
      : products.filter((item) => item.category === selectedCategory);
    const map = new Map<string, CommunityShopProduct[]>();
    for (const product of filtered) {
      const list = map.get(product.category) || [];
      list.push(product);
      map.set(product.category, list);
    }
    return [...map.entries()];
  }, [products, selectedCategory]);

  function maximum(product: CommunityShopProduct) {
    const stock = product.remainingStock ?? 20;
    const userRemaining = product.perUserLimit === null
      ? 20
      : Math.max(0, product.perUserLimit - product.purchasedQuantity);
    const affordable = Math.floor(balance / product.priceCoins);
    return product.type === "role" ? Math.min(1, stock, userRemaining, affordable) : Math.min(20, stock, userRemaining, affordable);
  }

  async function purchase(product: CommunityShopProduct) {
    const max = maximum(product);
    const quantity = Math.max(1, Math.min(max, quantities[product.id] || 1));
    if (max < 1) return;
    const idempotencyKey = requestKeys.current[product.id] || crypto.randomUUID();
    requestKeys.current[product.id] = idempotencyKey;
    setBusyId(product.id);
    setMessage(null);
    try {
      const response = await fetch("/api/community/shop/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity, idempotencyKey }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status < 500) delete requestKeys.current[product.id];
        throw new Error(body.error || "No se pudo completar la compra");
      }
      delete requestKeys.current[product.id];
      setBalance(body.balance);
      setProducts((current) => current.map((item) => item.id === product.id ? {
        ...item,
        soldCount: item.soldCount + quantity,
        remainingStock: item.remainingStock === null ? null : Math.max(0, item.remainingStock - quantity),
        purchasedQuantity: item.purchasedQuantity + quantity,
        ownedQuantity: item.type === "item" ? item.ownedQuantity + quantity : item.ownedQuantity,
      } : item));
      setQuantities((current) => ({ ...current, [product.id]: 1 }));
      setMessage({ tone: "success", text: `${product.name} fue entregado correctamente.` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "No se pudo completar la compra" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="shop-layout">
      <section className="shop-balance panel">
        <div><span className="eyebrow">Saldo disponible</span><strong>{balance.toLocaleString("es")}</strong><p>EyedCoins</p></div>
        <Coins />
      </section>

      {categories.length > 0 ? (
        <nav className="shop-categories" aria-label="Categorías de la tienda">
          <button className={selectedCategory === "all" ? "active" : ""} onClick={() => setSelectedCategory("all")}>Todas</button>
          {categories.map((category) => (
            <button
              key={category}
              className={selectedCategory === category ? "active" : ""}
              onClick={() => setSelectedCategory(category)}
            >
              {labelFor(category)}
            </button>
          ))}
        </nav>
      ) : null}

      {message ? (
        <p className={`shop-feedback ${message.tone}`} role="status">
          {message.tone === "success" ? <Check size={17} /> : null}
          {message.text}
        </p>
      ) : null}

      {grouped.map(([category, items]) => (
        <section className="shop-category-block" key={category}>
          <h2>{labelFor(category)}</h2>
          <div className="shop-grid">
            {items.map((product) => {
              const max = maximum(product);
              const quantity = Math.max(1, Math.min(max || 1, quantities[product.id] || 1));
              const soldOut = product.remainingStock === 0;
              const limited = product.perUserLimit !== null && product.purchasedQuantity >= product.perUserLimit;
              const unavailable = soldOut || limited || max < 1;
              const imageSrc = productImage(product);
              return (
                <article className="shop-product panel" key={product.id}>
                  <div className="shop-product-media">
                    {imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageSrc} alt="" loading="lazy" referrerPolicy="no-referrer" />
                    ) : <ProductIcon type={product.type} />}
                    <span>{typeLabels[product.type]}</span>
                  </div>
                  <div className="shop-product-body">
                    <h2>{product.name}</h2>
                    <p>{product.description || "Producto de la comunidad."}</p>
                    <div className="shop-product-meta">
                      <strong><Coins size={15} /> {product.priceCoins.toLocaleString("es")}</strong>
                      <span>{product.remainingStock === null ? "Stock ilimitado" : `${product.remainingStock} disponibles`}</span>
                      {product.ownedQuantity > 0 ? <span>En inventario: {product.ownedQuantity}</span> : null}
                      {product.purchasedQuantity > 0 && product.source !== "gacha" ? <span>Comprados: {product.purchasedQuantity}</span> : null}
                    </div>
                    <div className="shop-buy-row">
                      {product.type !== "role" && max > 1 ? (
                        <input
                          aria-label={`Cantidad de ${product.name}`}
                          type="number"
                          min={1}
                          max={max}
                          value={quantity}
                          onChange={(event) => setQuantities((current) => ({
                            ...current,
                            [product.id]: Math.max(1, Math.min(max, Number.parseInt(event.target.value, 10) || 1)),
                          }))}
                        />
                      ) : null}
                      <button className="primary-button" disabled={busyId !== null || unavailable} onClick={() => void purchase(product)}>
                        {busyId === product.id ? "Comprando…" : soldOut ? "Agotado" : limited ? "Límite alcanzado" : max < 1 ? "Saldo insuficiente" : "Comprar"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
