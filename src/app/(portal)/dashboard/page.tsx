import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock3, Coins, Crown, MessageCircle, Sparkles, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { StatCard } from "@/components/stat-card";
import { EyedBotApiError, getCommunityProfile } from "@/lib/eyedbot-api";
import { DEMO_USER_ID, IS_DEMO_MODE } from "@/lib/demo";

const compact = new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 });

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id && !IS_DEMO_MODE) redirect("/");
  const userId = session?.user?.id || DEMO_USER_ID;

  let profile;
  try {
    profile = await getCommunityProfile(userId);
  } catch (error) {
    if (error instanceof EyedBotApiError && error.status === 403) redirect("/access-denied");
    return <Unavailable />;
  }

  const voiceHours = Math.round((profile.stats.voiceMinutes / 60) * 10) / 10;

  return (
    <>
      <section className="profile-hero">
        <div className="profile-copy">
          <span className="eyebrow">Tu espacio personal</span>
          <h1>Hola, {profile.user.displayName}.</h1>
          <p>Este es el impacto que has dejado en EyedComun.</p>
        </div>
        <div className="profile-identity">
          {profile.user.avatarUrl ? (
            <Image src={profile.user.avatarUrl} alt="" width={76} height={76} className="avatar avatar-large" />
          ) : <span className="avatar avatar-large avatar-fallback" />}
          <div><strong>Nivel {profile.stats.level}</strong><span>#{profile.stats.rank || "—"} del servidor</span></div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard icon={MessageCircle} label="Mensajes" value={compact.format(profile.stats.messages)} detail="Desde que llegó EyedBot" accent="violet" />
        <StatCard icon={Clock3} label="Tiempo en voz" value={`${voiceHours} h`} detail={`${compact.format(profile.stats.voiceMinutes)} minutos`} accent="cyan" />
        <StatCard icon={Trophy} label="Experiencia" value={compact.format(profile.stats.xp)} detail={`Nivel ${profile.stats.level}`} accent="amber" />
        <StatCard icon={Coins} label="EyedCoins" value={compact.format(profile.gacha.coins)} detail={`${profile.gacha.collectionSize} objetos`} accent="rose" />
      </section>

      <section className="split-grid">
        <article className="panel spotlight-panel">
          <div>
            <span className="eyebrow"><Sparkles size={14} /> Eyed Wrapped</span>
            <h2>Tu historia merece ser recordada.</h2>
            <p>Revive tus mensajes, horas en llamada, días más activos y posición del año.</p>
            <Link className="secondary-button" href={`/wrapped/${new Date().getUTCFullYear()}`}>
              Ver mi Wrapped
            </Link>
          </div>
          <div className="orb"><Crown size={36} /></div>
        </article>
        <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">Colección</span><h2>Tu mundo gacha</h2></div><strong>{profile.gacha.bestRarity || "—"}</strong></div>
          <div className="mini-stats">
            <div><span>Personajes</span><strong>{profile.gacha.collectionSize}</strong></div>
            <div><span>Tiradas</span><strong>{profile.gacha.pulls}</strong></div>
            <div><span>Mejor rareza</span><strong>{profile.gacha.bestRarity || "Sin datos"}</strong></div>
          </div>
        </article>
      </section>
    </>
  );
}

function Unavailable() {
  return (
    <section className="empty-card">
      <h1>EyedBot está descansando</h1>
      <p>No pudimos cargar tus estadísticas. Inténtalo nuevamente en unos minutos.</p>
    </section>
  );
}
