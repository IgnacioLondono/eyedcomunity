"use client";

import { useRouter } from "next/navigation";
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
];

export function CommunityLiveEvents() {
  const router = useRouter();

  useEffect(() => {
    const source = new EventSource("/api/community/events");
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 750);
    };
    EVENT_TYPES.forEach((type) => source.addEventListener(type, refresh));
    return () => {
      if (timer) clearTimeout(timer);
      source.close();
    };
  }, [router]);

  return null;
}
