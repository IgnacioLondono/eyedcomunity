import { redirect } from "next/navigation";
import { Star, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { EyedBotApiError, getCommunityAchievements } from "@/lib/eyedbot-api";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;
  let data;
  try {
    data = await getCommunityAchievements(userId);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <Unavailable />;
  }
  const unlocked = data.items.filter((achievement) => achievement.unlocked).length;

  return (
    <>
      <PageHeader eyebrow="Tu perfil" title="Logros" description="Colecciona insignias participando y dejando huella en la comunidad." />
      <section className="achievement-summary panel">
        <div className="achievement-ring"><strong>{unlocked}</strong><span>de {data.items.length}</span></div>
        <div><span className="eyebrow">Colección real</span><h2>{unlocked === data.items.length ? "Colección completa" : "En progreso"}</h2><p>EyedBot entrega el progreso y los desbloqueos; el portal no los recalcula.</p></div>
        <b><Star /> Estado verificado</b>
      </section>
      <section className="achievement-grid">
        {data.items.map((achievement, index) => (
          <article className={`achievement-card ${achievement.unlocked ? "unlocked" : ""}`} key={achievement.id}>
            <div className={`achievement-icon accent-${["violet", "cyan", "amber", "rose"][index % 4]}`}><Trophy /></div>
            <div><h3>{achievement.definition.title}</h3><p>{achievement.definition.description}</p></div>
            <div className="progress-track"><span style={{ width: `${Math.min(100, achievement.progress / Math.max(1, achievement.definition.target) * 100)}%` }} /></div>
            <small>{achievement.unlocked ? `Desbloqueado · +${achievement.reward.eyedCoins} EyedCoins` : `${achievement.progress.toLocaleString("es")} / ${achievement.definition.target.toLocaleString("es")}`}</small>
          </article>
        ))}
      </section>
    </>
  );
}

function Unavailable() {
  return <section className="empty-card"><h1>Los logros no están disponibles</h1><p>EyedBot no pudo entregar tus estadísticas.</p></section>;
}
