import { redirect } from "next/navigation";
import { Check, Clock3, Flame, MessageCircle, Mic2, Target, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { DEMO_USER_ID, IS_DEMO_MODE } from "@/lib/demo";
import { EyedBotApiError, getCommunityProfile, getCommunityServer } from "@/lib/eyedbot-api";

export default async function ChallengesPage() {
  const session = await auth();
  if (!session?.user?.id && !IS_DEMO_MODE) redirect("/");
  const userId = session?.user?.id || DEMO_USER_ID;
  let profile;
  let server;
  try {
    [profile, server] = await Promise.all([getCommunityProfile(userId), getCommunityServer(userId)]);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <Unavailable />;
  }

  const week = profile.activity.slice(-7);
  const messages = week.reduce((sum, day) => sum + day.messages, 0);
  const voiceMinutes = week.reduce((sum, day) => sum + day.voiceMinutes, 0);
  const activeDays = week.filter((day) => day.messages > 0 || day.voiceMinutes > 0).length;
  const challenges = [
    { icon: MessageCircle, title: "Conversador", detail: "Envía 250 mensajes esta semana", value: messages, goal: 250 },
    { icon: Mic2, title: "Hora social", detail: "Pasa 5 horas en canales de voz", value: voiceMinutes, goal: 300 },
    { icon: Flame, title: "Sin descanso", detail: "Participa durante 7 días", value: activeDays, goal: 7 },
  ];
  const completed = challenges.filter((challenge) => challenge.value >= challenge.goal).length;
  const weeklyCommunityMessages = server.daily.slice(-7).reduce((sum, day) => sum + day.messages, 0);
  const communityGoal = 100_000;

  return (
    <>
      <PageHeader eyebrow="Diversión" title="Retos" description="Objetivos semanales calculados con tu actividad real en EyedBot." />
      <section className="challenge-banner">
        <div className="challenge-level"><Trophy /><strong>{completed}</strong></div>
        <div><span className="eyebrow">Semana actual</span><h2>Tu progreso</h2><p>{completed} de {challenges.length} objetivos completados.</p><div className="progress-track"><span style={{ width: `${(completed / challenges.length) * 100}%` }} /></div></div>
        <span><Clock3 /> Seguimiento semanal</span>
      </section>
      <section className="challenge-list">
        {challenges.map(({ icon: Icon, title, detail, value, goal }) => {
          const complete = value >= goal;
          return (
            <article className={`panel challenge-card ${complete ? "complete" : ""}`} key={title}>
              <div className="challenge-icon">{complete ? <Check /> : <Icon />}</div>
              <div><h3>{title}</h3><p>{detail}</p><div className="progress-track"><span style={{ width: `${Math.min(100, (value / goal) * 100)}%` }} /></div><small>{value} / {goal}</small></div>
              <b>{complete ? "Completado" : "En progreso"}</b>
            </article>
          );
        })}
      </section>
      <section className="panel community-goal">
        <Target /><div><span className="eyebrow">Actividad comunitaria</span><h2>{communityGoal.toLocaleString("es")} mensajes esta semana</h2><p>La comunidad lleva {weeklyCommunityMessages.toLocaleString("es")} mensajes registrados.</p></div><strong>{Math.min(100, Math.round((weeklyCommunityMessages / communityGoal) * 100))}%</strong>
      </section>
    </>
  );
}

function Unavailable() {
  return <section className="empty-card"><h1>Los retos no están disponibles</h1><p>EyedBot no pudo entregar la actividad semanal.</p></section>;
}
