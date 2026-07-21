"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const EVENT_TYPES = [
  "challenge.progress",
  "challenge.claimed",
  "achievement.unlocked",
  "activity.invalidated",
  "ranking.invalidated",
  "presence.changed",
  "plan.created",
  "plan.invited",
  "plan.invitation_accepted",
  "plan.invitation_rejected",
  "plan.joined",
  "plan.left",
  "plan.status_changed",
  "party.created",
  "party.joined",
  "party.left",
  "party.status",
  "party.action",
  "community.settings_changed",
  "shop.purchase_completed",
  "shop.products_changed",
];

export function CommunityLiveEvents() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const source = new EventSource("/api/community/events");
    let timer: ReturnType<typeof setTimeout> | null = null;
    let refreshWhenVisible = false;
    const affectsCurrentPage = (type: string) => {
      if (type === "community.settings_changed") return true;
      if (type.startsWith("plan.")) return pathname.startsWith("/plans");
      if (type.startsWith("party.")) return pathname.startsWith("/party");
      if (type.startsWith("challenge.")) return pathname.startsWith("/challenges") || pathname === "/dashboard";
      if (type === "achievement.unlocked") return pathname.startsWith("/achievements") || pathname === "/dashboard";
      if (type === "activity.invalidated") return ["/activity", "/dashboard", "/wrapped"].some((path) => pathname.startsWith(path));
      if (type === "ranking.invalidated") return ["/ranking", "/dashboard", "/lobby", "/members", "/wrapped"].some((path) => pathname.startsWith(path));
      if (type === "presence.changed") return ["/lobby", "/server", "/members"].some((path) => pathname.startsWith(path));
      if (type.startsWith("shop.")) return pathname.startsWith("/shop") || pathname === "/dashboard";
      return false;
    };
    const refresh = (type: string) => {
      if (!affectsCurrentPage(type)) return;
      if (document.hidden) {
        refreshWhenVisible = true;
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 500);
    };
    const listeners = EVENT_TYPES.map((type) => {
      const listener = () => refresh(type);
      source.addEventListener(type, listener);
      return { type, listener };
    });
    const onVisibilityChange = () => {
      if (!document.hidden && refreshWhenVisible) {
        refreshWhenVisible = false;
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      if (timer) clearTimeout(timer);
      listeners.forEach(({ type, listener }) => source.removeEventListener(type, listener));
      document.removeEventListener("visibilitychange", onVisibilityChange);
      source.close();
    };
  }, [pathname, router]);

  return null;
}
