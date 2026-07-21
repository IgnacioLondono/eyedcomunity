"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";

export function WrappedActions({ year }: { year: number }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const data = {
      title: `Mi Eyed Wrapped ${year}`,
      text: `Mira mi Eyed Wrapped ${year} en EyedComun`,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(data).catch(() => null);
      return;
    }
    await copyLink();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  return (
    <div className="wrapped-actions">
      <button onClick={share}><Share2 size={17} /> Compartir</button>
      <button onClick={copyLink}>{copied ? <Check size={17} /> : <Link2 size={17} />}{copied ? "Copiado" : "Copiar enlace"}</button>
    </div>
  );
}
