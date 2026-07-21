import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function AccessDenied() {
  return (
    <main className="centered-page">
      <div className="empty-card">
        <ShieldX size={36} />
        <p className="eyebrow">Acceso restringido</p>
        <h1>Este espacio es solo para la comunidad</h1>
        <p>Únete al servidor de EyedComun o vuelve a intentarlo con otra cuenta de Discord.</p>
        <Link className="discord-button" href="/">Volver al inicio</Link>
      </div>
    </main>
  );
}
