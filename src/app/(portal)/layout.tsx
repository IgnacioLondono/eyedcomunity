import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { VisualEffects } from "@/components/visual-effects";
import { DEMO_USER, IS_DEMO_MODE } from "@/lib/demo";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id && !IS_DEMO_MODE) redirect("/");

  return (
    <div className="portal-layout">
      <PortalSidebar user={session?.user || DEMO_USER} demo={IS_DEMO_MODE && !session?.user?.id} />
      <main className="portal-shell">{children}</main>
      <VisualEffects />
    </div>
  );
}
