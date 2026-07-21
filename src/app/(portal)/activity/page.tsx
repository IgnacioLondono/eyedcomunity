import { Clock3, Flame, MessageCircle, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";

const weeks = Array.from({ length: 24 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ((week * 11 + day * 7 + 3) % 5)),
);

export default function ActivityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Tu perfil"
        title="Actividad"
        description="Así ha cambiado tu participación durante los últimos meses."
        action={<button className="ghost-button">Últimos 6 meses</button>}
      />

      <section className="stats-grid">
        <StatCard icon={Flame} label="Racha actual" value="18 días" detail="Tu récord es de 32 días" accent="rose" />
        <StatCard icon={MessageCircle} label="Promedio diario" value="64" detail="Mensajes por día activo" />
        <StatCard icon={Clock3} label="Sesión más larga" value="6,4 h" detail="El 18 de octubre" accent="cyan" />
        <StatCard icon={TrendingUp} label="Crecimiento" value="+24%" detail="Comparado con el mes pasado" accent="amber" />
      </section>

      <section className="panel activity-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Constancia</span><h2>Tu mapa de actividad</h2></div>
          <span className="heat-legend">Menos <i /><i /><i /><i /><i /> Más</span>
        </div>
        <div className="heatmap">
          {weeks.flatMap((week, weekIndex) =>
            week.map((level, dayIndex) => (
              <span className={`heat-${level}`} key={`${weekIndex}-${dayIndex}`} title={`Nivel de actividad ${level}`} />
            )),
          )}
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">Por hora</span><h2>Cuándo apareces</h2></div></div>
          <div className="hour-bars">
            {[18, 12, 8, 5, 6, 14, 32, 54, 71, 88, 96, 82].map((height, index) => (
              <div key={index}><span style={{ height: `${height}%` }} /><small>{index * 2}h</small></div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">Reciente</span><h2>Últimos hitos</h2></div></div>
          <div className="timeline">
            <p><i />Alcanzaste el nivel 42 <span>hace 2 días</span></p>
            <p><i />Superaste 18.000 mensajes <span>hace 6 días</span></p>
            <p><i />Completaste el reto Noctámbulo <span>hace 1 semana</span></p>
            <p><i />Entraste al top 3 del servidor <span>hace 2 semanas</span></p>
          </div>
        </article>
      </section>
    </>
  );
}
