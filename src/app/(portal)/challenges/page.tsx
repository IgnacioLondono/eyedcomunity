import { Check, Clock3, Flame, MessageCircle, Mic2, Target, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const challenges = [
  { icon: MessageCircle, title: "Conversador", detail: "Envía 250 mensajes esta semana", value: 184, goal: 250, reward: "500 XP" },
  { icon: Mic2, title: "Hora social", detail: "Pasa 5 horas en canales de voz", value: 210, goal: 300, reward: "350 XP" },
  { icon: Flame, title: "Sin descanso", detail: "Mantén una racha de 7 días", value: 7, goal: 7, reward: "Insignia" },
];

export default function ChallengesPage() {
  return (
    <>
      <PageHeader eyebrow="Diversión" title="Retos" description="Objetivos semanales para ganar XP, monedas e insignias especiales." />
      <section className="challenge-banner">
        <div className="challenge-level"><Trophy /><strong>7</strong></div>
        <div><span className="eyebrow">Pase de temporada</span><h2>Temporada Eclipse</h2><p>3.420 / 5.000 puntos para alcanzar el siguiente nivel.</p><div className="progress-track"><span style={{ width: "68%" }} /></div></div>
        <span><Clock3 /> 12 días restantes</span>
      </section>
      <section className="challenge-list">
        {challenges.map(({ icon: Icon, title, detail, value, goal, reward }) => {
          const complete = value >= goal;
          return (
            <article className={`panel challenge-card ${complete ? "complete" : ""}`} key={title}>
              <div className="challenge-icon">{complete ? <Check /> : <Icon />}</div>
              <div><h3>{title}</h3><p>{detail}</p><div className="progress-track"><span style={{ width: `${Math.min(100, (value / goal) * 100)}%` }} /></div><small>{value} / {goal}</small></div>
              <b>{reward}</b>
            </article>
          );
        })}
      </section>
      <section className="panel community-goal">
        <Target /><div><span className="eyebrow">Reto comunitario</span><h2>100.000 mensajes entre todos</h2><p>La comunidad lleva 76.480. Al completarlo, todos reciben una caja especial.</p></div><strong>76%</strong>
      </section>
    </>
  );
}
