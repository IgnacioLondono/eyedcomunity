"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ContactRound,
  Gamepad2,
  Medal,
  Orbit,
  Settings,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CommunityFeatureKey } from "@/lib/types";

const groups: Array<{
  label: string;
  links: Array<{
    href: string;
    label: string;
    icon: LucideIcon;
    feature?: CommunityFeatureKey;
  }>;
}> = [
  {
    label: "Tu perfil",
    links: [
      { href: "/dashboard", label: "Resumen", icon: BarChart3 },
      { href: "/activity", label: "Actividad", icon: Activity, feature: "activity" as CommunityFeatureKey },
      { href: "/achievements", label: "Logros", icon: Medal, feature: "achievements" as CommunityFeatureKey },
      { href: `/wrapped/${new Date().getUTCFullYear()}`, label: "Wrapped", icon: Sparkles, feature: "wrapped" as CommunityFeatureKey },
    ],
  },
  {
    label: "Comunidad",
    links: [
      { href: "/server", label: "Servidor", icon: Users, feature: "server" as CommunityFeatureKey },
      { href: "/lobby", label: "Lobby", icon: ContactRound, feature: "lobby" as CommunityFeatureKey },
      { href: "/ranking", label: "Ranking", icon: Trophy, feature: "ranking" as CommunityFeatureKey },
      { href: "/circle", label: "EyedCircle", icon: Orbit, feature: "circle" as CommunityFeatureKey },
      { href: "/plans", label: "Quedadas", icon: CalendarDays, feature: "plans" as CommunityFeatureKey },
    ],
  },
  {
    label: "Diversión",
    links: [
      { href: "/party", label: "EyedParty", icon: Gamepad2, feature: "party" as CommunityFeatureKey },
      { href: "/challenges", label: "Retos", icon: Target, feature: "challenges" as CommunityFeatureKey },
    ],
  },
];

export function SidebarLinks({
  features,
  isAdmin,
}: {
  features: Record<CommunityFeatureKey, boolean>;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="sidebar-scroll">
      {groups.map((group) => (
        <div className="sidebar-group" key={group.label}>
          <p>{group.label}</p>
          {group.links.filter((link) => !link.feature || features[link.feature]).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return (
              <Link href={href} className={active ? "active" : ""} key={href} title={label}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      ))}
      {isAdmin && (
        <div className="sidebar-group">
          <p>Administración</p>
          <Link href="/admin" className={pathname === "/admin" ? "active" : ""}>
            <Settings size={18} />
            <span>Panel admin</span>
          </Link>
        </div>
      )}
    </div>
  );
}
