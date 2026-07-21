"use client";

import { useState } from "react";
import { Palette } from "lucide-react";

const PRESETS = ["#5865F2", "#57F287", "#FEE75C", "#EB459E", "#ED4245", "#23272A", "#9B59B6", "#1ABC9C"];

export function BannerColorEditor({
  initialColor,
  hasNitroBanner,
  accentColor,
}: {
  initialColor: string | null;
  hasNitroBanner: boolean;
  accentColor: string | null;
}) {
  const fallback = initialColor || accentColor || "#5865F2";
  const [color, setColor] = useState(fallback);
  const [saved, setSaved] = useState(initialColor);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(next: string | null) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile/banner-color", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: next }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo guardar");
      setSaved(body.bannerColor);
      if (body.bannerColor) setColor(body.bannerColor);
      setMessage(next ? "Color guardado" : "Color restablecido");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  if (hasNitroBanner) {
    return (
      <article className="panel profile-media-editor">
        <div className="panel-heading">
          <div>
            <span className="eyebrow"><Palette size={14} /> Banner</span>
            <h2>Banner de Discord</h2>
          </div>
        </div>
        <p className="form-message" style={{ margin: 0 }}>
          Se usa automáticamente tu banner Nitro de Discord. No hace falta configurar nada aquí.
        </p>
      </article>
    );
  }

  return (
    <article className="panel profile-media-editor">
      <div className="panel-heading">
        <div>
          <span className="eyebrow"><Palette size={14} /> Banner</span>
          <h2>Color del banner</h2>
        </div>
      </div>
      <p style={{ margin: "0 0 1rem", color: "var(--muted)", fontSize: ".78rem" }}>
        No detectamos un banner Nitro en tu cuenta. Elige un color para tu portada en el lobby y en tu perfil.
      </p>
      <div className="banner-color-preview" style={{ background: `linear-gradient(135deg, ${color}, #111018)` }} />
      <div className="banner-color-controls">
        <label>
          <span>Color</span>
          <input
            type="color"
            value={color}
            disabled={busy}
            onChange={(event) => setColor(event.target.value.toUpperCase())}
          />
        </label>
        <div className="banner-color-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={color.toUpperCase() === preset ? "selected" : ""}
              style={{ background: preset }}
              disabled={busy}
              aria-label={`Usar ${preset}`}
              onClick={() => setColor(preset)}
            />
          ))}
        </div>
        <div className="media-actions">
          <button className="ghost-button" type="button" disabled={busy} onClick={() => save(color)}>
            {busy ? "Guardando..." : "Guardar color"}
          </button>
          {saved && (
            <button className="ghost-button" type="button" disabled={busy} onClick={() => save(null)}>
              Usar color de Discord
            </button>
          )}
        </div>
      </div>
      {message && <p className="form-message">{message}</p>}
    </article>
  );
}
