import Image from "next/image";
import { redirect } from "next/navigation";
import { Clock3, MessageCircle, TrendingUp, UserPlus } from "lucide-react";
import { auth } from "@/auth";
import { StatCard } from "@/components/stat-card";
import { EyedBotApiError, getCommunityServer } from "@/lib/eyedbot-api";

const compact = new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 });

export default async function ServerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;

  let data;
  try {
    data = await getCommunityServer(userId);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <section className="empty-card"><h1>No pudimos conectar con el servidor</h1><p>EyedBot no está disponible en este momento.</p></section>;
  }

  const recent = data.daily.slice(-14);
  const maxMessages = Math.max(1, ...recent.map((day) => day.messages));

  return (
    <>
      <section className="profile-hero server-hero">
        <div className="profile-copy">
          <span className="eyebrow"><span className="live-dot" /> Comunidad en vivo</span>
          <h1>{data.guild.name}</h1>
          <p>{compact.format(data.guild.memberCount)} miembros construyendo algo juntos.</p>
        </div>
        {data.guild.iconUrl && <Image src={data.guild.iconUrl} alt="" width={84} height={84} className="server-icon" />}
      </section>

      <section className="stats-grid">
        <StatCard icon={MessageCircle} label="Mensajes" value={compact.format(data.totals.messages)} detail="Actividad registrada" />
        <StatCard icon={Clock3} label="Minutos en voz" value={compact.format(data.totals.voiceMinutes)} detail="Conversaciones compartidas" accent="cyan" />
        <StatCard icon={UserPlus} label="Nuevos miembros" value={compact.format(data.totals.joins)} detail={`${data.totals.leaves} salidas`} accent="rose" />
        <StatCard icon={TrendingUp} label="Conectados" value={compact.format(data.guild.onlineCount)} detail="Ahora mismo" accent="amber" />
      </section>

      <section className="split-grid wide-left">
        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">Últimos 14 días</span><h2>Ritmo de mensajes</h2></div></div>
          <div className="bar-chart" aria-label="Mensajes diarios">
            {recent.map((day) => (
              <div key={day.date} className="bar-column" title={`${day.date}: ${day.messages} mensajes`}>
                <span style={{ height: `${Math.max(5, (day.messages / maxMessages) * 100)}%` }} />
                <small>{day.date.slice(8)}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">Top comunidad</span><h2>Clasificación</h2></div></div>
          <ol className="leaderboard">
            {data.leaderboard.slice(0, 7).map((member, index) => (
              <li key={member.userId}>
                <span className="rank">{index + 1}</span>
                {member.avatarUrl ? <Image src={member.avatarUrl} alt="" width={34} height={34} className="avatar" /> : <span className="avatar avatar-fallback" />}
                <div><strong>{member.displayName}</strong><small>Nivel {member.level}</small></div>
                <b>{compact.format(member.xp)} XP</b>
              </li>
            ))}
          </ol>
        </article>
      </section>
    </>
  );
}
