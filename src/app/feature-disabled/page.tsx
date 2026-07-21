import Link from "next/link";

export default function FeatureDisabledPage() {
  return (
    <main className="access-page">
      <section className="empty-card">
        <h1>Esta función no está disponible</h1>
        <p>Un administrador la desactivó temporalmente.</p>
        <Link className="secondary-button" href="/dashboard">Volver al resumen</Link>
      </section>
    </main>
  );
}
