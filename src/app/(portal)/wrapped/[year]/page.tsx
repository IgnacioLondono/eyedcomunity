import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, Flame, MessageCircle, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { auth } from "@/auth";
import { WrappedActions } from "@/components/wrapped-actions";
import { EyedBotApiError, getCommunityWrapped } from "@/lib/eyedbot-api";

export default async function WrappedPage({ params }: { params: Promise<{ year: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;

  const { year: rawYear } = await params;
  const year = Number.parseInt(rawYear, 10);
  if (!Number.isInteger(year) || year < 2020 || year > new Date().getUTCFullYear()) notFound();

  let wrapped;
  try {
    wrapped = await getCommunityWrapped(userId, year);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <section className="empty-card"><h1>Tu Wrapped aún no está disponible</h1><p>Vuelve cuando EyedBot haya podido preparar tus recuerdos.</p></section>;
  }

  const voiceHours = Math.round((wrapped.stats.voiceMinutes / 60) * 10) / 10;
  const messagesPerDay = wrapped.stats.activeDays > 0
    ? Math.round(wrapped.stats.messages / wrapped.stats.activeDays)
    : 0;
  const monthly = wrapped.stats.monthly;
  const maxMonthly = Math.max(1, ...monthly.map((month) => month.messages));
  const favoriteMonth = monthly.reduce((best, month) => month.messages > best.messages ? month : best, monthly[0]);
  const persona = voiceHours >= 100
    ? { name: "Alma de la llamada", text: "Siempre hay una buena conversación cuando apareces.", icon: Clock3 }
    : { name: "Voz de la comunidad", text: "Tus mensajes mantuvieron vivo cada rincón del servidor.", icon: MessageCircle };
  const PersonaIcon = persona.icon;

  return (
    <div className="wrapped">
      <section className="wrapped-intro">
        <div className="wrapped-kicker"><Sparkles size={15} /> Eyed Wrapped <span>{wrapped.year}</span></div>
        <div className="wrapped-year">{wrapped.year}</div>
        <div className="wrapped-avatar-orbit">
          <i /><i />
          {wrapped.user.avatarUrl ? (
            <Image src={wrapped.user.avatarUrl} alt="" width={104} height={104} className="avatar wrapped-avatar" />
          ) : <span className="avatar wrapped-avatar avatar-fallback" />}
        </div>
        <h1>Este fue el año de<br /><em>{wrapped.user.displayName}</em></h1>
        <p>Una historia escrita entre mensajes, llamadas y momentos dentro de EyedComun.</p>
        <WrappedActions year={wrapped.year} />
        {!wrapped.finalized && (
          <div className="history-notice">
            <CalendarDays size={17} />
            Cobertura {wrapped.dataFrom && wrapped.dataTo ? `${wrapped.dataFrom} — ${wrapped.dataTo}` : "aún sin datos"} · {wrapped.timezone}.
          </div>
        )}
      </section>

      <section className="wrapped-opening">
        <span className="eyebrow">En pocas palabras</span>
        <h2>Estuviste ahí.<br />Y se notó.</h2>
        <div className="wrapped-glance">
          <div><MessageCircle /><strong>{wrapped.stats.messages.toLocaleString("es")}</strong><span>mensajes</span></div>
          <div><Clock3 /><strong>{voiceHours}</strong><span>horas en voz</span></div>
          <div><Flame /><strong>{wrapped.stats.activeDays}</strong><span>días activo</span></div>
          <div><Trophy /><strong>#{wrapped.stats.rank || "—"}</strong><span>del servidor</span></div>
        </div>
      </section>

      <section className="wrapped-story panel">
        <div className="wrapped-section-copy">
          <span className="eyebrow"><MessageCircle size={14} /> Tu voz escrita</span>
          <h2>{wrapped.stats.messages.toLocaleString("es")} veces elegiste participar.</h2>
          <p>Eso equivale a una media de <strong>{messagesPerDay} mensajes</strong> cada día que estuviste activo.</p>
        </div>
        <div className="monthly-chart">
          {monthly.map((month) => (
            <div key={month.month}>
              <span style={{ height: `${Math.max(4, (month.messages / maxMonthly) * 100)}%` }} />
              <small>{monthName(month.month)}</small>
            </div>
          ))}
        </div>
        <div className="chart-caption"><Sparkles size={15} /> {favoriteMonth?.messages ? `${monthName(favoriteMonth.month, true)} fue tu mes más activo, con ${favoriteMonth.messages.toLocaleString("es")} mensajes.` : "Tu actividad mensual aparecerá aquí."}</div>
      </section>

      <section className="wrapped-duo">
        <article className="wrapped-number cyan">
          <Clock3 />
          <span>Compartiste</span>
          <strong>{voiceHours}</strong>
          <h2>horas en voz</h2>
          <p>{wrapped.stats.voiceMinutes.toLocaleString("es")} minutos de conversaciones, risas y silencios cómodos.</p>
        </article>
        <article className="wrapped-fact panel">
          <Zap />
          <span className="eyebrow">Para imaginarlo</span>
          <strong>{Math.max(1, Math.round(voiceHours / 2))}</strong>
          <h2>películas completas</h2>
          <p>Ese es aproximadamente el tiempo que compartiste en llamada.</p>
        </article>
      </section>

      <section className="wrapped-persona">
        <div className="persona-aura"><PersonaIcon /></div>
        <span className="eyebrow">Tu personalidad de {wrapped.year}</span>
        <h2>{persona.name}</h2>
        <p>{persona.text}</p>
        <div><Star /> Edición {wrapped.year} <Star /></div>
      </section>

      <section className="wrapped-summary">
        <div><Flame /><span>Días activo</span><strong>{wrapped.stats.activeDays}</strong><small>dentro de la cobertura registrada</small></div>
        <div><Trophy /><span>Posición final</span><strong>#{wrapped.stats.rank || "—"}</strong><small>{wrapped.stats.rank && wrapped.stats.rank <= 10 ? "Top 10 de la comunidad" : "Sigue escalando"}</small></div>
        <div><CalendarDays /><span>Tu mejor día</span><strong>{formatFavoriteDay(wrapped.stats.favoriteDay)}</strong><small>Tu pico de actividad</small></div>
        <div><Zap /><span>XP conseguida</span><strong>{wrapped.stats.xpEarned.toLocaleString("es")}</strong><small>durante este periodo</small></div>
      </section>

      {wrapped.highlights.length > 0 && (
        <section className="panel highlight-list wrapped-highlights">
          <div><span className="eyebrow">Tus momentos</span><h2>Lo que hizo único tu año</h2></div>
          {wrapped.highlights.map((highlight, index) => <p key={highlight}><span>0{index + 1}</span>{highlight}</p>)}
        </section>
      )}

      <section className="wrapped-finale">
        <Sparkles />
        <span className="eyebrow">Eso fue todo por ahora</span>
        <h2>Gracias por ser parte<br />de EyedComun.</h2>
        <p>El próximo capítulo ya se está escribiendo.</p>
        <WrappedActions year={wrapped.year} />
        {year > 2020 && <Link href={`/wrapped/${year - 1}`}>Ver Wrapped {year - 1} <ArrowRight size={16} /></Link>}
      </section>
    </div>
  );
}

function monthName(month: number, long = false) {
  const date = new Date(Date.UTC(2026, Math.max(0, month - 1), 1));
  return new Intl.DateTimeFormat("es", { month: long ? "long" : "short", timeZone: "UTC" }).format(date).replace(".", "");
}

function formatFavoriteDay(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short", timeZone: "UTC" }).format(date).replace(".", "");
}
