import { Clock3, Crown, Flame, Gem, MessageCircle, Mic2, Star, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const achievements = [
  { icon: MessageCircle, name: "Voz de la comunidad", detail: "Envía 10.000 mensajes", progress: 100, tone: "violet" },
  { icon: Mic2, name: "Nunca cuelga", detail: "Acumula 100 horas en voz", progress: 100, tone: "cyan" },
  { icon: Crown, name: "Entre la élite", detail: "Alcanza el top 3 del servidor", progress: 100, tone: "amber" },
  { icon: Flame, name: "Imparable", detail: "Mantén una racha de 30 días", progress: 60, tone: "rose" },
  { icon: Gem, name: "Coleccionista", detail: "Consigue 100 personajes", progress: 86, tone: "violet" },
  { icon: Clock3, name: "Veterano", detail: "Cumple un año en EyedComun", progress: 78, tone: "cyan" },
  { icon: Star, name: "Leyenda", detail: "Alcanza el nivel 50", progress: 84, tone: "amber" },
  { icon: Trophy, name: "Campeón de Party", detail: "Gana 25 partidas", progress: 52, tone: "rose" },
];

export default function AchievementsPage() {
  return (
    <>
      <PageHeader eyebrow="Tu perfil" title="Logros" description="Colecciona insignias participando y dejando huella en la comunidad." />
      <section className="achievement-summary panel">
        <div className="achievement-ring"><strong>12</strong><span>de 28</span></div>
        <div><span className="eyebrow">Nivel de colección</span><h2>Explorador avanzado</h2><p>Desbloquea 3 logros más para subir a Veterano.</p></div>
        <b>2.450 pts</b>
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
