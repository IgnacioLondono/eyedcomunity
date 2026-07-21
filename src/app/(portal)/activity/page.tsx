import { redirect } from "next/navigation";
import { Clock3, Flame, MessageCircle, TrendingUp } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DEMO_USER_ID, IS_DEMO_MODE } from "@/lib/demo";
import { EyedBotApiError, getCommunityProfile } from "@/lib/eyedbot-api";

export default async function ActivityPage() {
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
  const days = fillDays(profile.activity, 168);
  const active = days.filter((day) => day.messages > 0 || day.voiceMinutes > 0);
  const streak = currentStreak(days);
  const average = active.length ? Math.round(active.reduce((sum, day) => sum + day.messages, 0) / active.length) : 0;
  const recent = days.slice(-30).reduce((sum, day) => sum + day.messages + day.voiceMinutes, 0);
  const previous = days.slice(-60, -30).reduce((sum, day) => sum + day.messages + day.voiceMinutes, 0);
  const growth = previous ? Math.round(((recent - previous) / previous) * 100) : 0;
  const maxActivity = Math.max(1, ...days.map((day) => day.messages + day.voiceMinutes));

  return (
    <>
      <PageHeader
        eyebrow="Tu perfil"
        title="Actividad"
        description="Así ha cambiado tu participación durante los últimos meses."
        action={<span className="ghost-button">Últimas 24 semanas</span>}
      />

      <section className="stats-grid">
        <StatCard icon={Flame} label="Racha actual" value={`${streak} días`} detail={`${active.length} días registrados`} accent="rose" />
        <StatCard icon={MessageCircle} label="Promedio diario" value={average.toLocaleString("es")} detail="Mensajes por día activo" />
        <StatCard icon={Clock3} label="Tiempo en voz" value={`${Math.round(profile.stats.voiceMinutes / 60)} h`} detail="Actividad acumulada" accent="cyan" />
        <StatCard icon={TrendingUp} label="Crecimiento" value={`${growth > 0 ? "+" : ""}${growth}%`} detail="Últimos 30 días frente a los anteriores" accent="amber" />
      </section>

      <section className="panel activity-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Constancia</span><h2>Tu mapa de actividad</h2></div>
          <span className="heat-legend">Menos <i /><i /><i /><i /><i /> Más</span>
        </div>
        <div className="heatmap">
          {days.map((day) => {
            const score = day.messages + day.voiceMinutes;
            const level = score ? Math.max(1, Math.ceil((score / maxActivity) * 4)) : 0;
            return <span className={`heat-${level}`} key={day.date} title={`${day.date}: ${day.messages} mensajes, ${day.voiceMinutes} min de voz`} />;
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><span className="eyebrow">Progreso real</span><h2>Tu estado actual</h2></div></div>
        <div className="timeline">
          <p><i />Alcanzaste el nivel {profile.stats.level}<span>{profile.stats.xp.toLocaleString("es")} XP</span></p>
          <p><i />Has enviado {profile.stats.messages.toLocaleString("es")} mensajes<span>Registro de EyedBot</span></p>
          <p><i />Estás en la posición #{profile.stats.rank || "—"}<span>de {profile.stats.memberCount} miembros</span></p>
        </div>
      </section>
    </>
  );
}

function fillDays(activity: Array<{ date: string; messages: number; voiceMinutes: number; xpEarned: number }>, count: number) {
  const byDate = new Map(activity.map((day) => [day.date, day]));
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (count - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return byDate.get(key) || { date: key, messages: 0, voiceMinutes: 0, xpEarned: 0 };
  });
}

function currentStreak(days: Array<{ messages: number; voiceMinutes: number }>) {
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].messages <= 0 && days[index].voiceMinutes <= 0) break;
    streak += 1;
  }
  return streak;
}

function Unavailable() {
  return <section className="empty-card"><h1>La actividad no está disponible</h1><p>EyedBot no pudo entregar tus estadísticas.</p></section>;
}
