import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3, Coins, MessageCircle, Orbit, Sparkles, Trophy, UserPlus } from "lucide-react";
import { auth } from "@/auth";
import { StatCard } from "@/components/stat-card";
import { DEMO_USER_ID, IS_DEMO_MODE } from "@/lib/demo";
import { EyedBotApiError, getCommunityMember } from "@/lib/eyedbot-api";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id && !IS_DEMO_MODE) redirect("/");
  const viewerId = session?.user?.id || DEMO_USER_ID;
  const { id } = await params;
  if (!/^\d{10,25}$/.test(id)) notFound();

  let profile: Awaited<ReturnType<typeof getCommunityMember>> | null = null;
  try {
    profile = await getCommunityMember(viewerId, id);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    if (error instanceof EyedBotApiError && error.status === 404) notFound();
  }

  if (!profile) return <div className="empty-card"><h1>No pudimos abrir este perfil</h1><p>Puede que el miembro ya no pertenezca al servidor.</p></div>;
  const { user } = profile;
  return (
    <>
        <Link href="/lobby" className="back-link"><ArrowLeft size={16} /> Volver al lobby</Link>
        <section className="public-profile-hero">
          <div className="public-cover" />
          <div className="public-profile-main">
            <div className="public-avatar avatar avatar-fallback"><i className={`status-dot status-${user.status}`} /></div>
            <div><span className="eyebrow">Perfil de la comunidad</span><h1>{user.displayName}</h1><p>@{user.username} · {user.activity || "Sin actividad"}</p></div>
            <button className="secondary-button"><UserPlus size={17} /> Añadir al círculo</button>
          </div>
          <div className="profile-badges">{profile.badges.map((badge) => <span key={badge}><Sparkles size={13} /> {badge}</span>)}</div>
        </section>

        <section className="stats-grid">
          <StatCard icon={Trophy} label="Nivel" value={String(user.level)} detail={`#${user.rank || "—"} del servidor`} accent="amber" />
          <StatCard icon={MessageCircle} label="Mensajes" value={user.messages.toLocaleString("es")} detail={`${user.xp.toLocaleString("es")} XP`} />
          <StatCard icon={Clock3} label="Tiempo en voz" value={`${Math.round(user.voiceMinutes / 60)} h`} detail="Actividad acumulada" accent="cyan" />
          <StatCard icon={Coins} label="EyedCoins" value={profile.gacha.coins.toLocaleString("es")} detail={`${profile.gacha.collectionSize} personajes`} accent="rose" />
        </section>

        <section className="split-grid">
          <article className="panel">
            <div className="panel-heading"><div><span className="eyebrow">Acerca de</span><h2>Su paso por EyedComun</h2></div></div>
            <div className="profile-facts">
              <p><span>Miembro desde</span><strong>{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("es", { year: "numeric", month: "long" }) : "Sin datos"}</strong></p>
              <p><span>Estado actual</span><strong className="presence-label"><i className={`status-dot status-${user.status}`} /> {user.status === "offline" ? "Desconectado" : user.activity || "En línea"}</strong></p>
              <p><span>Mejor rareza</span><strong>{profile.gacha.bestRarity || "—"}</strong></p>
              <p><span>Tiradas gacha</span><strong>{profile.gacha.pulls}</strong></p>
            </div>
          </article>
          <article className="panel">
            <div className="panel-heading"><div><span className="eyebrow"><Orbit size={13} /> En común</span><h2>Círculos compartidos</h2></div></div>
            <div className="mutual-circles">
              {profile.mutualCircles.map((circle, index) => <p key={circle}><i className={index ? "circle-cyan" : "circle-violet"}><Orbit /></i><span><strong>{circle}</strong><small>También perteneces aquí</small></span></p>)}
            </div>
            <Link href="/circle" className="ghost-button">Explorar EyedCircle</Link>
          </article>
        </section>
    </>
  );
}
