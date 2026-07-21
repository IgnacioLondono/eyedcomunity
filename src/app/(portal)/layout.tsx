import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { VisualEffects } from "@/components/visual-effects";
import { DEMO_USER, IS_DEMO_MODE } from "@/lib/demo";
import { getProfileMedia } from "@/lib/media/service";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id && !IS_DEMO_MODE) redirect("/");
  let sidebarUser = session?.user || DEMO_USER;
  if (session?.user?.id && !IS_DEMO_MODE) {
    try {
      const custom = await getProfileMedia(session.user.id);
      if (custom.avatarUrl) sidebarUser = { ...session.user, image: custom.avatarUrl };
    } catch (error) {
      console.error("No se pudo cargar el avatar personalizado", error);
    }
  }

  return (
    <div className="portal-layout">
      <PortalSidebar user={sidebarUser} demo={IS_DEMO_MODE && !session?.user?.id} />
      <main className="portal-shell">{children}</main>
      <VisualEffects />
    </div>
  );
}
