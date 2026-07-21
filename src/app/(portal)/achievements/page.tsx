import { redirect } from "next/navigation";
import { Clock3, Crown, Gem, MessageCircle, Mic2, Star, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { DEMO_USER_ID, IS_DEMO_MODE } from "@/lib/demo";
import { EyedBotApiError, getCommunityProfile } from "@/lib/eyedbot-api";

const CURRENT_TIMESTAMP = Date.now();

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id && !IS_DEMO_MODE) redirect("/");
  const userId = session?.user?.id || DEMO_USER_ID;
  let profile;
  try {
    profile = await getCommunityProfile(userId);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <Unavailable />;
  }
  const membershipDays = profile.user.joinedAt
    ? Math.max(0, Math.floor((CURRENT_TIMESTAMP - new Date(profile.user.joinedAt).getTime()) / 86_400_000))
    : 0;
  const achievements = [
    { icon: MessageCircle, name: "Voz de la comunidad", detail: "Envía 10.000 mensajes", progress: progress(profile.stats.messages, 10_000), tone: "violet" },
    { icon: Mic2, name: "Nunca cuelga", detail: "Acumula 100 horas en voz", progress: progress(profile.stats.voiceMinutes, 6_000), tone: "cyan" },
    { icon: Crown, name: "Entre la élite", detail: "Alcanza el top 3 del servidor", progress: profile.stats.rank && profile.stats.rank <= 3 ? 100 : progress(profile.stats.memberCount - (profile.stats.rank || profile.stats.memberCount), profile.stats.memberCount - 3), tone: "amber" },
    { icon: Gem, name: "Coleccionista", detail: "Consigue 100 personajes", progress: progress(profile.gacha.collectionSize, 100), tone: "violet" },
    { icon: Clock3, name: "Veterano", detail: "Cumple un año en EyedComun", progress: progress(membershipDays, 365), tone: "cyan" },
    { icon: Star, name: "Leyenda", detail: "Alcanza el nivel 50", progress: progress(profile.stats.level, 50), tone: "amber" },
    { icon: Trophy, name: "Invocador", detail: "Completa 500 tiradas gacha", progress: progress(profile.gacha.pulls, 500), tone: "rose" },
  ];
  const unlocked = achievements.filter((achievement) => achievement.progress === 100).length;

  return (
    <>
      <PageHeader eyebrow="Tu perfil" title="Logros" description="Colecciona insignias participando y dejando huella en la comunidad." />
      <section className="achievement-summary panel">
        <div className="achievement-ring"><strong>{unlocked}</strong><span>de {achievements.length}</span></div>
        <div><span className="eyebrow">Colección real</span><h2>{unlocked === achievements.length ? "Leyenda de EyedComun" : "En progreso"}</h2><p>Tus logros se calculan directamente con las estadísticas de EyedBot.</p></div>
        <b>{unlocked * 250} pts</b>
      </section>
      <section className="achievement-grid">
        {achievements.map(({ icon: Icon, name, detail, progress, tone }) => (
          <article className={`achievement-card ${progress === 100 ? "unlocked" : ""}`} key={name}>
            <div className={`achievement-icon accent-${tone}`}><Icon /></div>
            <div><h3>{name}</h3><p>{detail}</p></div>
            <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
            <small>{progress === 100 ? "Desbloqueado" : `${progress}% completado`}</small>
          </article>
        ))}
      </section>
    </>
  );
}

function progress(value: number, goal: number) {
  return Math.max(0, Math.min(100, Math.round((value / Math.max(1, goal)) * 100)));
}

function Unavailable() {
  return <section className="empty-card"><h1>Los logros no están disponibles</h1><p>EyedBot no pudo entregar tus estadísticas.</p></section>;
}
