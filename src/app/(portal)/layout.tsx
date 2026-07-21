import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CommunityLiveEvents } from "@/components/community-live-events";
import { PortalSidebar } from "@/components/portal-sidebar";
import { VisualEffects } from "@/components/visual-effects";
import { getProfileMedia } from "@/lib/media/service";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  let sidebarUser = session.user;
  try {
    const custom = await getProfileMedia(session.user.id);
    if (custom.avatarUrl) sidebarUser = { ...session.user, image: custom.avatarUrl };
  } catch (error) {
    console.error("No se pudo cargar el avatar personalizado", error);
  }

  return (
    <div className="portal-layout">
      <PortalSidebar user={sidebarUser} />
      <main className="portal-shell">{children}</main>
      <CommunityLiveEvents />
      <VisualEffects />
    </div>
  );
}
