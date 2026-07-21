import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, ShieldCheck, Sparkles, Users } from "lucide-react";
import { auth, signIn } from "@/auth";
import { IS_PORTAL_CONFIGURED, MISSING_PORTAL_CONFIG } from "@/lib/demo";

export default async function Home() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <main className="landing">
      <header className="landing-nav">
        <Link href="/" className="brand">
          <span className="brand-mark"><Image src="/eyedcomun-logo.png" alt="" width={34} height={34} priority /></span>
          <span>Eyed<span className="muted">Comun</span></span>
        </Link>
        <span className="member-pill"><ShieldCheck size={15} /> Solo comunidad</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span /> Tu comunidad, en números</div>
        <h1>Todo lo que vives en<br /><em>EyedComun.</em></h1>
        <p>
          Descubre tu actividad, compara tus logros y revive los mejores momentos
          del servidor en un espacio creado para la comunidad.
        </p>
        {IS_PORTAL_CONFIGURED ? (
          <form action={async () => {
            "use server";
            await signIn("discord", { redirectTo: "/dashboard" });
          }}>
            <button className="discord-button">
              Continuar con Discord <ArrowRight size={19} />
            </button>
          </form>
        ) : (
          <div className="empty-card">
            <strong>Configuración requerida</strong>
            <span>Faltan variables del portal: {MISSING_PORTAL_CONFIG.join(", ")}.</span>
          </div>
        )}
        <small>Necesitas ser miembro del Discord de EyedComun.</small>
      </section>

      <section className="feature-strip">
        <article><BarChart3 /><div><strong>Tus estadísticas</strong><span>Mensajes, voz, XP y posición.</span></div></article>
        <article><Users /><div><strong>El servidor</strong><span>Actividad y rankings en vivo.</span></div></article>
        <article><Sparkles /><div><strong>Tu Wrapped</strong><span>Un año de momentos inolvidables.</span></div></article>
      </section>
    </main>
  );
}
