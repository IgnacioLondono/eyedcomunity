"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ContactRound,
  Gamepad2,
  Lightbulb,
  Medal,
  Orbit,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

const groups = [
  {
    label: "Tu perfil",
    links: [
      { href: "/dashboard", label: "Resumen", icon: BarChart3 },
      { href: "/activity", label: "Actividad", icon: Activity },
      { href: "/achievements", label: "Logros", icon: Medal },
      { href: `/wrapped/${new Date().getUTCFullYear()}`, label: "Wrapped", icon: Sparkles, badge: "Nuevo" },
    ],
  },
  {
    label: "Comunidad",
    links: [
      { href: "/server", label: "Servidor", icon: Users },
      { href: "/lobby", label: "Lobby", icon: ContactRound, badge: "Nuevo" },
      { href: "/ranking", label: "Ranking", icon: Trophy },
      { href: "/circle", label: "EyedCircle", icon: Orbit, badge: "Beta" },
      { href: "/plans", label: "Quedadas", icon: CalendarDays },
    ],
  },
  {
    label: "Diversión",
    links: [
      { href: "/party", label: "EyedParty", icon: Gamepad2 },
      { href: "/challenges", label: "Retos", icon: Target },
      { href: "/roadmap", label: "Próximamente", icon: Lightbulb },
    ],
  },
];

export function SidebarLinks() {
  const pathname = usePathname();

  return (
    <div className="sidebar-scroll">
      {groups.map((group) => (
        <div className="sidebar-group" key={group.label}>
          <p>{group.label}</p>
          {group.links.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link href={href} className={active ? "active" : ""} key={href} title={label}>
                <Icon size={18} />
                <span>{label}</span>
                {badge && <small>{badge}</small>}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
