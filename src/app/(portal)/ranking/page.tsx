import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, Medal, Sparkles, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { EyedBotApiError, getCommunityRanking } from "@/lib/eyedbot-api";
import type { RankingMetric, RankingPeriod } from "@/lib/types";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ metric?: string; period?: string; cursor?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;
  const query = await searchParams;
  const metric: RankingMetric = ["xp", "messages", "voice"].includes(query.metric || "")
    ? query.metric as RankingMetric : "xp";
  const period: RankingPeriod = ["all", "week", "month", "year"].includes(query.period || "")
    ? query.period as RankingPeriod : "all";
  let data;
  try {
    data = await getCommunityRanking(userId, { metric, period, cursor: query.cursor, limit: 25 });
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <Unavailable />;
  }

  const members = data.items;
  const podium = [members[1], members[0], members[2]];
  const podiumClasses = ["podium-second", "podium-first", "podium-third"];
  const podiumIcons = [Medal, Crown, Trophy];
  const podiumRanks = [2, 1, 3];

  return (
    <>
      <PageHeader eyebrow="Comunidad" title="Ranking" description="Clasificación real dentro de la cobertura disponible." action={
        <form><select name="metric" defaultValue={metric}><option value="xp">XP</option><option value="messages">Mensajes</option><option value="voice">Voz</option></select>
          <select name="period" defaultValue={period}><option value="all">Todo</option><option value="week">Semana</option><option value="month">Mes</option><option value="year">Año</option></select>
          <button className="ghost-button">Aplicar</button></form>
      } />
      <section className="podium">
        {podium.map((member, index) => {
          if (!member) return <article className={podiumClasses[index]} key={podiumRanks[index]} />;
          const Icon = podiumIcons[index];
          return (
            <article className={podiumClasses[index]} key={member.user.id}>
              <Icon /><span>#{podiumRanks[index]}</span>
              {member.user.avatarUrl ? <Image src={member.user.avatarUrl} alt="" width={58} height={58} className="avatar" /> : <div className="avatar avatar-fallback" />}
              <h3>{member.user.displayName}</h3><strong>{formatValue(member.value, metric)}</strong>
            </article>
          );
        })}
      </section>
      <section className="panel ranking-table">
        <div className="ranking-row ranking-head"><span>Posición</span><span>Miembro</span><span><Sparkles /> {metricLabel(metric)}</span><span>Periodo</span><span>Desde</span><span>Hasta</span></div>
        {members.map((member) => (
          <div className={`ranking-row ${member.user.id === userId ? "is-you" : ""}`} key={member.user.id}>
            <strong>#{member.position}</strong>
            <span className="ranking-member">
              {member.user.avatarUrl ? <Image src={member.user.avatarUrl} alt="" width={34} height={34} className="avatar" /> : <i className="avatar avatar-fallback" />}
              {member.user.displayName}{member.user.id === userId && <small>Tú</small>}
            </span>
            <b>{formatValue(member.value, metric)}</b><span>{period}</span>
            <span>{data.dataFrom || "—"}</span><span>{data.dataTo || "—"}</span>
          </div>
        ))}
      </section>
      <div className="section-title">
        <span>Tu posición: {data.requesterPosition ? `#${data.requesterPosition}` : "—"}</span>
        {data.nextCursor && <Link className="ghost-button" href={`/ranking?metric=${metric}&period=${period}&cursor=${encodeURIComponent(data.nextCursor)}`}>Siguiente página</Link>}
      </div>
    </>
  );
}

function formatValue(value: number, metric: RankingMetric) {
  if (metric === "voice") return `${Math.round(value / 3600)} h`;
  return new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function metricLabel(metric: RankingMetric) {
  return metric === "xp" ? "XP" : metric === "messages" ? "Mensajes" : "Voz";
}

function Unavailable() {
  return <section className="empty-card"><h1>El ranking no está disponible</h1><p>No pudimos obtener la clasificación de EyedBot.</p></section>;
}
