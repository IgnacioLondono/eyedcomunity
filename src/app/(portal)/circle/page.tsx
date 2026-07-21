import { Camera, Heart, Image as ImageIcon, MessageCircle, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function CirclePage() {
  return (
    <>
      <PageHeader
        eyebrow="EyedCircle · Beta"
        title="Tu círculo"
        description="Un espacio privado para compartir momentos con tus amigos más cercanos."
        action={<button className="secondary-button"><Plus size={17} /> Crear publicación</button>}
      />
      <section className="circle-layout">
        <div className="feed">
          <article className="composer panel">
            <span className="avatar avatar-fallback" />
            <span>Comparte algo con tu círculo...</span>
            <button><ImageIcon size={18} /> Foto</button>
          </article>
          <article className="post panel">
            <header><span className="avatar avatar-fallback" /><div><strong>Luna</strong><small>hace 24 minutos · Círculo cercano</small></div></header>
            <p>La llamada de anoche fue demasiado buena. Hay que repetir esto el viernes.</p>
            <div className="photo-placeholder"><Camera /><span>Recuerdo del grupo</span></div>
            <footer><button><Heart size={17} /> 18</button><button><MessageCircle size={17} /> 6 comentarios</button></footer>
          </article>
          <article className="post panel">
            <header><span className="avatar avatar-fallback" /><div><strong>Kai</strong><small>hace 2 horas · Gaming</small></div></header>
            <p>¿Quién se apunta al torneo de EyedParty esta noche? Ya somos cuatro.</p>
            <footer><button><Heart size={17} /> 9</button><button><MessageCircle size={17} /> 12 comentarios</button></footer>
          </article>
        </div>
        <aside className="circle-aside">
          <article className="panel">
            <div className="panel-heading"><div><span className="eyebrow">Tus círculos</span><h2>Grupos</h2></div><Plus size={18} /></div>
            <div className="circle-list">
              <p><i className="circle-violet"><Users /></i><span><strong>Los noctámbulos</strong><small>8 miembros</small></span></p>
              <p><i className="circle-cyan"><Users /></i><span><strong>Gaming</strong><small>14 miembros</small></span></p>
              <p><i className="circle-rose"><Users /></i><span><strong>Círculo cercano</strong><small>6 miembros</small></span></p>
            </div>
          </article>
          <article className="panel prompt-card"><span className="eyebrow">Pregunta del día</span><h3>¿Cuál fue tu mejor recuerdo del servidor?</h3><button className="ghost-button">Responder</button></article>
        </aside>
      </section>
    </>
  );
}
