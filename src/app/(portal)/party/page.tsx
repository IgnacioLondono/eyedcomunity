import { Brain, Gamepad2, Play, Swords, Timer, Users, WandSparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const games = [
  { icon: Brain, title: "Trivia Eyed", detail: "Preguntas de cultura, gaming y la comunidad.", players: "2–20", tone: "violet" },
  { icon: Users, title: "¿Quién es más probable?", detail: "Descubre cuánto conoces a tus amigos.", players: "4–16", tone: "cyan" },
  { icon: WandSparkles, title: "Dibujo secreto", detail: "Dibuja, adivina y provoca el caos.", players: "3–12", tone: "rose" },
  { icon: Swords, title: "Duelo relámpago", detail: "Minijuegos rápidos uno contra uno.", players: "2", tone: "amber" },
];

export default function PartyPage() {
  return (
    <>
      <PageHeader eyebrow="Diversión" title="EyedParty" description="Juegos sociales conectados con Discord para animar cualquier llamada." action={<button className="secondary-button"><Play size={17} /> Crear sala</button>} />
      <section className="party-hero">
        <div><span className="member-pill"><span className="live-dot" /> 3 salas activas</span><h2>La fiesta empieza<br />con un clic.</h2><p>Invita a tus amigos desde Discord y juega sin descargar nada.</p><button className="discord-button"><Gamepad2 size={18} /> Jugar ahora</button></div>
        <div className="party-orbit"><i><Brain /></i><i><Swords /></i><i><WandSparkles /></i><strong>E</strong></div>
      </section>
      <div className="section-title"><div><span className="eyebrow">Juegos disponibles</span><h2>Elige cómo romper el hielo</h2></div><button className="ghost-button">Ver todos</button></div>
      <section className="game-grid">
        {games.map(({ icon: Icon, title, detail, players, tone }) => (
          <article className="game-card panel" key={title}>
            <div className={`game-icon accent-${tone}`}><Icon /></div>
            <span className="game-players"><Users size={14} /> {players}</span>
            <h3>{title}</h3><p>{detail}</p>
            <button>Crear partida <Play size={15} /></button>
          </article>
        ))}
      </section>
      <section className="panel active-room">
        <div className="room-pulse"><Timer /></div>
        <div><span className="eyebrow">Sala pública</span><h3>Trivia nocturna</h3><p>Ronda 4 de 10 · 8 jugadores</p></div>
        <div className="avatar-stack"><i /><i /><i /><i /></div>
        <button className="ghost-button">Unirse</button>
      </section>
    </>
  );
}
