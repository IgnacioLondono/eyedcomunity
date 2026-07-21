import { CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export default function PlansPage() {
  return (
    <>
      <PageHeader eyebrow="Comunidad" title="Quedadas" description="Los próximos planes reales de la comunidad aparecerán aquí." action={<span className="secondary-button"><Plus size={17} /> Próximamente</span>} />
      <section className="panel empty-plan">
        <CalendarDays />
        <div><h3>Aún no hay quedadas publicadas</h3><p>El calendario de planes todavía no está conectado. Ya no mostramos eventos de demostración como si fueran reales.</p></div>
      </section>
    </>
  );
}
