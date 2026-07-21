import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CommunityLiveEvents } from "@/components/community-live-events";
import { PortalSidebar } from "@/components/portal-sidebar";
import { VisualEffects } from "@/components/visual-effects";
import { getCommunitySettings } from "@/lib/eyedbot-api";
import type { CommunityFeatureKey } from "@/lib/types";

const defaultFeatures = Object.fromEntries([
  "activity", "achievements", "wrapped", "server", "lobby",
  "ranking", "circle", "plans", "party", "challenges", "shop",
].map((key) => [key, true])) as Record<CommunityFeatureKey, boolean>;

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const community = await getCommunitySettings(session.user.id).catch(() => ({
    settings: { features: defaultFeatures, maintenance: false },
    isAdmin: false,
  }));

  return (
    <div className="portal-layout">
      <PortalSidebar user={session.user} features={community.settings.features} isAdmin={community.isAdmin} />
      <main className="portal-shell">{children}</main>
      <CommunityLiveEvents />
      <VisualEffects />
    </div>
  );
}
