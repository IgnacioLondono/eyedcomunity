import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { SidebarLinks } from "./sidebar-links";
import { SidebarToggle } from "./sidebar-toggle";

type Props = {
  user: {
    name?: string | null;
    image?: string | null;
  };
  demo?: boolean;
};

export function PortalSidebar({ user, demo = false }: Props) {
  return (
    <aside className="portal-sidebar">
      <div className="sidebar-header">
        <Link href="/dashboard" className="brand sidebar-brand">
          <span className="brand-mark"><Image src="/eyedcomun-logo.png" alt="" width={34} height={34} priority /></span>
          <span>Eyed<span className="muted">Comun</span></span>
        </Link>
        <SidebarToggle />
      </div>

      <SidebarLinks />

      <div className="sidebar-profile">
        {user.image ? (
          <Image unoptimized={user.image.startsWith("/api/media/")} src={user.image} alt="" width={38} height={38} className="avatar" />
        ) : <span className="avatar avatar-fallback" />}
        <div>
          <strong>{user.name || "Nova"}</strong>
          <span>{demo ? "Vista de demostración" : "Miembro de EyedComun"}</span>
        </div>
        {demo ? (
          <Link className="icon-button" href="/" aria-label="Salir de la demo"><LogOut size={17} /></Link>
        ) : (
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <button className="icon-button" aria-label="Cerrar sesión"><LogOut size={17} /></button>
          </form>
        )}
      </div>
    </aside>
  );
}
