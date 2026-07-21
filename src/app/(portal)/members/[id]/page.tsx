import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock3, MessageCircle, Sparkles, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { StatCard } from "@/components/stat-card";
import { EyedBotApiError, getCommunityMember } from "@/lib/eyedbot-api";
import { getProfileMedia } from "@/lib/media/service";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const viewerId = session.user.id;
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
  let customMedia = { avatarUrl: null as string | null, bannerUrl: null as string | null };
  try {
    customMedia = await getProfileMedia(id);
  } catch (error) {
    console.error("No se pudo cargar el perfil personalizado", error);
  }
  const avatarUrl = customMedia.avatarUrl || user.avatarUrl;
  const bannerUrl = customMedia.bannerUrl || user.bannerUrl;
  return (
    <>
        <Link href="/lobby" className="back-link"><ArrowLeft size={16} /> Volver al lobby</Link>
        <section className="public-profile-hero">
          <div className="public-cover" style={coverStyle(bannerUrl, user.accentColor)} />
          <div className="public-profile-main">
            <div className={`public-avatar avatar ${avatarUrl ? "" : "avatar-fallback"}`}>
              {avatarUrl && <Image unoptimized={Boolean(customMedia.avatarUrl)} src={avatarUrl} alt="" width={112} height={112} priority />}
              <i className={`status-dot status-${user.status}`} />
            </div>
            <div><span className="eyebrow">Perfil de la comunidad</span><h1>{user.displayName}</h1><p>@{user.username}</p></div>
          </div>
          <div className="profile-badges">{profile.badges.map((badge) => <span key={badge}><Sparkles size={13} /> {badge}</span>)}</div>
        </section>

        <section className="stats-grid">
          <StatCard icon={Trophy} label="Nivel" value={String(user.level)} detail={`#${user.rank || "—"} del servidor`} accent="amber" />
          <StatCard icon={MessageCircle} label="Mensajes" value={user.messages.toLocaleString("es")} detail={`${user.xp.toLocaleString("es")} XP`} />
          <StatCard icon={Clock3} label="Tiempo en voz" value={`${Math.round(user.voiceMinutes / 60)} h`} detail="Estado reportado por EyedBot" accent="cyan" />
        </section>

        <section className="split-grid">
          <article className="panel">
            <div className="panel-heading"><div><span className="eyebrow">Acerca de</span><h2>Su paso por EyedComun</h2></div></div>
            <div className="profile-facts">
              <p><span>Miembro desde</span><strong>{user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("es", { year: "numeric", month: "long" }) : "Sin datos"}</strong></p>
              <p><span>Estado actual</span><strong className="presence-label"><i className={`status-dot status-${user.status}`} /> {user.status === "offline" ? "Desconectado" : "En línea"}</strong></p>
            </div>
          </article>
        </section>
    </>
  );
}

function coverStyle(bannerUrl: string | null, accentColor: string | null) {
  if (bannerUrl) {
    return {
      backgroundImage: `linear-gradient(180deg, transparent, rgba(10, 9, 14, .35)), url("${bannerUrl}")`,
    };
  }
  if (accentColor) {
    return { background: `linear-gradient(135deg, ${accentColor}, #111018)` };
  }
  return undefined;
}
