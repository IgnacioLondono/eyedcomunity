import { CalendarDays, Clock3, MapPin, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const plans = [
  { day: "24", month: "JUL", title: "Noche de EyedParty", time: "22:00", place: "Canal Party #1", people: 18, tone: "violet" },
  { day: "27", month: "JUL", title: "Maratón de películas", time: "21:30", place: "Sala Cinema", people: 12, tone: "cyan" },
  { day: "02", month: "AGO", title: "Torneo comunitario", time: "19:00", place: "Arena Eyed", people: 32, tone: "rose" },
];

export default function PlansPage() {
  return (
    <>
      <PageHeader eyebrow="Comunidad" title="Quedadas" description="Organiza planes, vota horarios y no te pierdas ningún momento." action={<button className="secondary-button"><Plus size={17} /> Proponer plan</button>} />
      <section className="calendar-strip panel">
        {["Lun 20", "Mar 21", "Mié 22", "Jue 23", "Vie 24", "Sáb 25", "Dom 26"].map((day, index) => (
          <button className={index === 4 ? "selected" : ""} key={day}><span>{day.split(" ")[0]}</span><strong>{day.split(" ")[1]}</strong>{index === 4 && <i />}</button>
        ))}
      </section>
      <section className="plans-grid">
        {plans.map((plan) => (
          <article className="plan-card panel" key={plan.title}>
            <div className={`plan-date accent-${plan.tone}`}><strong>{plan.day}</strong><span>{plan.month}</span></div>
            <div className="plan-body"><span className="eyebrow">Evento comunitario</span><h2>{plan.title}</h2><p><Clock3 /> {plan.time}<MapPin /> {plan.place}</p></div>
            <div className="plan-people"><div className="avatar-stack"><i /><i /><i /></div><span><Users size={15} /> {plan.people} apuntados</span></div>
            <button className="ghost-button">Ver detalles</button>
          </article>
        ))}
      </section>
      <section className="panel empty-plan">
        <CalendarDays />
        <div><h3>¿No encuentras tu plan?</h3><p>Propón uno y deja que la comunidad vote el mejor horario.</p></div>
        <button className="ghost-button">Crear una encuesta</button>
      </section>
    </>
  );
}
