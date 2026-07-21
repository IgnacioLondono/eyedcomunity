import Link from "next/link";
import Image from "next/image";
import { BarChart3, LogOut, Sparkles, Users } from "lucide-react";
import { signOut } from "@/auth";

type Props = {
  user: {
    name?: string | null;
    image?: string | null;
  };
};

export function AppNav({ user }: Props) {
  return (
    <header className="app-nav">
      <Link href="/dashboard" className="brand">
        <span className="brand-mark"><Image src="/eyedcomun-logo.png" alt="" width={34} height={34} priority /></span>
        <span>Eyed<span className="muted">Comun</span></span>
      </Link>
      <nav>
        <Link href="/dashboard"><BarChart3 size={17} /> Mi espacio</Link>
        <Link href="/server"><Users size={17} /> Servidor</Link>
        <Link href={`/wrapped/${new Date().getUTCFullYear()}`}><Sparkles size={17} /> Wrapped</Link>
      </nav>
      <div className="nav-user">
        {user.image ? (
          <Image src={user.image} alt="" width={34} height={34} className="avatar" />
        ) : <span className="avatar avatar-fallback" />}
        <span>{user.name || "Miembro"}</span>
        <form action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}>
          <button className="icon-button" aria-label="Cerrar sesión"><LogOut size={17} /></button>
        </form>
      </div>
    </header>
  );
}
