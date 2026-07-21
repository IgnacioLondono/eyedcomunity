import Image from "next/image";
import { redirect } from "next/navigation";
import { Crown, Medal, MessageCircle, Mic2, Sparkles, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { DEMO_USER_ID, IS_DEMO_MODE } from "@/lib/demo";
import { EyedBotApiError, getCommunityServer } from "@/lib/eyedbot-api";

export default async function RankingPage() {
  const session = await auth();
  if (!session?.user?.id && !IS_DEMO_MODE) redirect("/");
  const userId = session?.user?.id || DEMO_USER_ID;
  let data;
  try {
    data = await getCommunityServer(userId);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <Unavailable />;
  }

  const members = data.leaderboard;
  const podium = [members[1], members[0], members[2]];
  const podiumClasses = ["podium-second", "podium-first", "podium-third"];
  const podiumIcons = [Medal, Crown, Trophy];
  const podiumRanks = [2, 1, 3];

  return (
    <>
      <PageHeader eyebrow="Comunidad" title="Ranking" description="Los miembros que están haciendo historia en EyedComun." action={<span className="ghost-button">Clasificación actual</span>} />
      <section className="podium">
        {podium.map((member, index) => {
          if (!member) return <article className={podiumClasses[index]} key={podiumRanks[index]} />;
          const Icon = podiumIcons[index];
          return (
            <article className={podiumClasses[index]} key={member.userId}>
              <Icon /><span>#{podiumRanks[index]}</span>
              {member.avatarUrl ? <Image src={member.avatarUrl} alt="" width={58} height={58} className="avatar" /> : <div className="avatar avatar-fallback" />}
              <h3>{member.displayName}</h3><strong>{formatCompact(member.xp)} XP</strong>
            </article>
          );
        })}
      </section>
      <section className="panel ranking-table">
        <div className="ranking-row ranking-head"><span>Posición</span><span>Miembro</span><span><Sparkles /> XP</span><span>Nivel</span><span><MessageCircle /> Mensajes</span><span><Mic2 /> Voz</span></div>
        {members.map((member, index) => (
          <div className={`ranking-row ${member.userId === userId ? "is-you" : ""}`} key={member.userId}>
            <strong>#{index + 1}</strong>
            <span className="ranking-member">
              {member.avatarUrl ? <Image src={member.avatarUrl} alt="" width={34} height={34} className="avatar" /> : <i className="avatar avatar-fallback" />}
              {member.displayName}{member.userId === userId && <small>Tú</small>}
            </span>
            <b>{member.xp.toLocaleString("es")}</b><span>{member.level}</span>
            <span>{member.messages.toLocaleString("es")}</span><span>{Math.round(member.voiceMinutes / 60)} h</span>
          </div>
        ))}
      </section>
    </>
  );
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function Unavailable() {
  return <section className="empty-card"><h1>El ranking no está disponible</h1><p>No pudimos obtener la clasificación de EyedBot.</p></section>;
}
