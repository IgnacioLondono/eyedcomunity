"use client";

import { useState } from "react";
import { Check, Download, Link2, Share2 } from "lucide-react";
import {
  canvasToPngBlob,
  renderWrappedCard,
  type WrappedCardInput,
} from "@/lib/wrapped-card";

export function WrappedActions(props: WrappedCardInput) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"share" | "download" | null>(null);
  const [message, setMessage] = useState("");

  async function buildFile() {
    const canvas = renderWrappedCard(props);
    const blob = await canvasToPngBlob(canvas);
    return new File([blob], `eyed-wrapped-${props.year}.png`, { type: "image/png" });
  }

  async function share() {
    setBusy("share");
    setMessage("");
    try {
      const file = await buildFile();
      const data: ShareData = {
        title: `Mi Eyed Wrapped ${props.year}`,
        text: `Mira mi Eyed Wrapped ${props.year}: ${props.messages.toLocaleString("es")} mensajes, ${props.voiceHours}h en voz.`,
        files: [file],
      };
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share(data);
        return;
      }
      if (navigator.share) {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: window.location.href,
        }).catch(() => null);
      }
      await downloadFile(file);
      setMessage("Imagen lista para enviar.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage(error instanceof Error ? error.message : "No se pudo compartir");
    } finally {
      setBusy(null);
    }
  }

  async function download() {
    setBusy("download");
    setMessage("");
    try {
      const file = await buildFile();
      await downloadFile(file);
      setMessage("Captura descargada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo descargar");
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  return (
    <div className="wrapped-actions-block">
      <div className="wrapped-actions">
        <button onClick={() => void share()} disabled={busy !== null}>
          <Share2 size={17} /> {busy === "share" ? "Preparando…" : "Compartir captura"}
        </button>
        <button onClick={() => void download()} disabled={busy !== null}>
          <Download size={17} /> {busy === "download" ? "Descargando…" : "Descargar imagen"}
        </button>
        <button onClick={() => void copyLink()}>
          {copied ? <Check size={17} /> : <Link2 size={17} />}
          {copied ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
      {message ? <p className="wrapped-share-message">{message}</p> : null}
    </div>
  );
}

async function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
