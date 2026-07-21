import { redirect } from "next/navigation";
import { Clock3, Flame, MessageCircle, TrendingUp } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EyedBotApiError, getCommunityActivity } from "@/lib/eyedbot-api";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;
  const requestedDays = Number.parseInt((await searchParams).days || "168", 10);
  const range = [30, 90, 168, 366].includes(requestedDays) ? requestedDays : 168;
  let activity;
  try {
    activity = await getCommunityActivity(userId, range);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <Unavailable />;
  }
  const days = activity.series;
  const active = days.filter((day) => day.messages > 0 || day.voiceMinutes > 0);
  const streak = currentStreak(days);
  const average = active.length ? Math.round(active.reduce((sum, day) => sum + day.messages, 0) / active.length) : 0;
  const recent = days.slice(-30).reduce((sum, day) => sum + day.messages + day.voiceMinutes, 0);
  const previous = days.slice(-60, -30).reduce((sum, day) => sum + day.messages + day.voiceMinutes, 0);
  const growth = previous ? Math.round(((recent - previous) / previous) * 100) : 0;
  const maxActivity = Math.max(1, ...days.map((day) => day.messages + day.voiceMinutes));
  const coveredVoice = days.reduce((sum, day) => sum + day.voiceSeconds, 0)
    + (activity.activeVoice?.uncheckpointedSeconds || 0);

  return (
    <>
      <PageHeader
        eyebrow="Tu perfil"
        title="Actividad"
        description="Así ha cambiado tu participación durante los últimos meses."
        action={<form><select name="days" defaultValue={String(range)} aria-label="Periodo">
          <option value="30">30 días</option><option value="90">90 días</option>
          <option value="168">24 semanas</option><option value="366">366 días</option>
        </select><button className="ghost-button">Aplicar</button></form>}
      />

      <section className="stats-grid">
        <StatCard icon={Flame} label="Racha actual" value={`${streak} días`} detail={`${active.length} días registrados`} accent="rose" />
        <StatCard icon={MessageCircle} label="Promedio diario" value={average.toLocaleString("es")} detail="Mensajes por día activo" />
        <StatCard icon={Clock3} label="Tiempo en voz" value={`${Math.round(coveredVoice / 3600)} h`} detail="Dentro de la cobertura mostrada" accent="cyan" />
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
        <div className="panel-heading"><div><span className="eyebrow">Cobertura real</span><h2>Periodo disponible</h2></div></div>
        <div className="timeline">
          <p><i />Seguimiento iniciado<span>{activity.trackingStartedAt ? new Date(activity.trackingStartedAt).toLocaleString("es") : "Aún sin historial"}</span></p>
          <p><i />Datos mostrados<span>{activity.dataFrom && activity.dataTo ? `${activity.dataFrom} — ${activity.dataTo}` : "Sin actividad registrada"}</span></p>
          <p><i />Zona horaria<span>{activity.timezone}</span></p>
          {activity.activeVoice && <p><i />Sesión de voz activa<span>+{activity.activeVoice.uncheckpointedSeconds} s sin consolidar</span></p>}
        </div>
      </section>
    </>
  );
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
