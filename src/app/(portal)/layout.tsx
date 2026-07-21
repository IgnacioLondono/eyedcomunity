import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CommunityLiveEvents } from "@/components/community-live-events";
import { PortalSidebar } from "@/components/portal-sidebar";
import { VisualEffects } from "@/components/visual-effects";
import { getCommunitySettings } from "@/lib/eyedbot-api";
import { getProfileMedia } from "@/lib/media/service";
import type { CommunityFeatureKey } from "@/lib/types";

const defaultFeatures = Object.fromEntries([
  "activity", "achievements", "wrapped", "server", "lobby",
  "ranking", "circle", "plans", "party", "challenges",
].map((key) => [key, true])) as Record<CommunityFeatureKey, boolean>;

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  let sidebarUser = session.user;
  const [custom, community] = await Promise.all([
    getProfileMedia(session.user.id).catch((error) => {
      console.error("No se pudo cargar el avatar personalizado", error);
      return { avatarUrl: null, bannerUrl: null };
    }),
    getCommunitySettings(session.user.id).catch(() => ({
      settings: { features: defaultFeatures, maintenance: false },
      isAdmin: false,
    })),
  ]);
  if (custom.avatarUrl) sidebarUser = { ...session.user, image: custom.avatarUrl };

  return (
    <div className="portal-layout">
      <PortalSidebar user={sidebarUser} features={community.settings.features} isAdmin={community.isAdmin} />
      <main className="portal-shell">{children}</main>
      <CommunityLiveEvents />
      <VisualEffects />
    </div>
  );
}
