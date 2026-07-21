import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import type { CommunityFeatureKey } from "@/lib/types";
import { SidebarLinks } from "./sidebar-links";
import { SidebarToggle } from "./sidebar-toggle";

type Props = {
  user: {
    name?: string | null;
    image?: string | null;
  };
  features: Record<CommunityFeatureKey, boolean>;
  isAdmin: boolean;
};

export function PortalSidebar({ user, features, isAdmin }: Props) {
  return (
    <aside className="portal-sidebar">
      <div className="sidebar-header">
        <Link href="/dashboard" className="brand sidebar-brand">
          <span className="brand-mark"><Image src="/eyedcomun-logo.png" alt="" width={34} height={34} priority /></span>
          <span>Eyed<span className="muted">Comun</span></span>
        </Link>
        <SidebarToggle />
      </div>

      <SidebarLinks features={features} isAdmin={isAdmin} />

      <div className="sidebar-profile">
        {user.image ? (
          <Image unoptimized={user.image.startsWith("/api/media/")} src={user.image} alt="" width={38} height={38} className="avatar" />
        ) : <span className="avatar avatar-fallback" />}
        <div>
          <strong>{user.name || "Miembro"}</strong>
          <span>Miembro de EyedComun</span>
        </div>
        <form action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}>
          <button className="icon-button" aria-label="Cerrar sesión"><LogOut size={17} /></button>
        </form>
      </div>
    </aside>
  );
}
