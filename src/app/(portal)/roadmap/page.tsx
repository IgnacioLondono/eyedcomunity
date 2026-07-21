import { Bot, Check, Circle, Clock3, Headphones, Image, Music2, Radio, Vote } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const ideas = [
  { icon: Music2, title: "Salas musicales", detail: "Escuchar playlists sincronizadas con amigos.", votes: 284, status: "En diseño" },
  { icon: Image, title: "Álbumes compartidos", detail: "Recuerdos privados dentro de cada círculo.", votes: 231, status: "Planeado" },
  { icon: Headphones, title: "Resumen de llamadas", detail: "Estadísticas y momentos de cada sesión de voz.", votes: 198, status: "Investigando" },
  { icon: Radio, title: "Radio comunitaria", detail: "Programación y directos creados por miembros.", votes: 147, status: "Idea" },
];

export default function RoadmapPage() {
  return (
    <>
      <PageHeader eyebrow="El futuro de Eyed" title="Próximamente" description="Ideas que podrían llegar al portal. La comunidad decide qué construimos primero." action={<button className="secondary-button"><Vote size={17} /> Proponer idea</button>} />
      <section className="roadmap-steps">
        <div className="done"><Check /><span>Disponible</span><strong>Estadísticas y Wrapped</strong></div>
        <i />
        <div className="current"><Clock3 /><span>En desarrollo</span><strong>EyedCircle y quedadas</strong></div>
        <i />
        <div><Circle /><span>Después</span><strong>EyedParty y retos</strong></div>
      </section>
      <section className="idea-grid">
        {ideas.map(({ icon: Icon, title, detail, votes, status }) => (
          <article className="panel idea-card" key={title}>
            <div className="idea-icon"><Icon /></div><span>{status}</span><h3>{title}</h3><p>{detail}</p>
            <button><Vote size={16} /> {votes} votos</button>
          </article>
        ))}
      </section>
      <section className="panel integration-card">
        <div className="integration-icons"><Bot /><span /><Radio /></div>
        <div><span className="eyebrow">Ecosistema Eyed</span><h2>Todo conectado con EyedBot</h2><p>Las nuevas funciones podrán enviar avisos, crear salas y actualizar tus estadísticas directamente desde Discord.</p></div>
      </section>
    </>
  );
}
