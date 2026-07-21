import { redirect } from "next/navigation";
import { Clock3, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { ChallengesClient } from "@/components/challenges-client";
import { PageHeader } from "@/components/page-header";
import { EyedBotApiError, getCommunityChallenges } from "@/lib/eyedbot-api";

export default async function ChallengesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;
  let data;
  try {
    data = await getCommunityChallenges(userId);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <Unavailable />;
  }

  const completed = data.items.filter((challenge) => challenge.completed).length;

  return (
    <>
      <PageHeader eyebrow="Diversión" title="Retos" description="Objetivos, progreso y recompensas entregados por EyedBot." />
      <section className="challenge-banner">
        <div className="challenge-level"><Trophy /><strong>{completed}</strong></div>
        <div><span className="eyebrow">Semana actual</span><h2>Tu progreso</h2><p>{completed} de {data.items.length} objetivos completados.</p></div>
        <span><Clock3 /> {data.period.startsOn} — {data.period.endsOn}</span>
      </section>
      <ChallengesClient challenges={data.items} />
    </>
  );
}

function Unavailable() {
  return <section className="empty-card"><h1>Los retos no están disponibles</h1><p>EyedBot no pudo entregar la actividad semanal.</p></section>;
}
