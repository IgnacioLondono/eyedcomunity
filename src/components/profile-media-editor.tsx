"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";

type Purpose = "avatar" | "banner";
type Quota = { usedBytes: number; quotaBytes: number };

export function ProfileMediaEditor({
  initialAvatarUrl,
  initialBannerUrl,
  initialQuota,
}: {
  initialAvatarUrl: string | null;
  initialBannerUrl: string | null;
  initialQuota: Quota;
}) {
  const [images, setImages] = useState({ avatar: initialAvatarUrl, banner: initialBannerUrl });
  const [quota, setQuota] = useState(initialQuota);
  const [busy, setBusy] = useState<Purpose | null>(null);
  const [message, setMessage] = useState("");

  async function upload(purpose: Purpose, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(purpose);
    setMessage("");
    const data = new FormData();
    data.set("purpose", purpose);
    data.set("file", file);
    try {
      const response = await fetch("/api/profile/media", { method: "POST", body: data });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setImages((current) => ({ ...current, [purpose]: `${body.media.url}?v=${Date.now()}` }));
      setQuota(body.quota);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo subir la imagen");
    } finally {
      setBusy(null);
    }
  }

  async function remove(purpose: Purpose) {
    setBusy(purpose);
    try {
      const response = await fetch("/api/profile/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setImages((current) => ({ ...current, [purpose]: null }));
      setQuota(body.quota);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar");
    } finally {
      setBusy(null);
    }
  }

  const percent = quota.quotaBytes ? Math.min(100, (quota.usedBytes / quota.quotaBytes) * 100) : 0;

  return (
    <article className="panel profile-media-editor">
      <div className="panel-heading">
        <div><span className="eyebrow"><ImageIcon size={14} /> Perfil personalizado</span><h2>Tus imágenes</h2></div>
        <span>{formatBytes(quota.usedBytes)} / {formatBytes(quota.quotaBytes)}</span>
      </div>
      <div className="quota-track"><i style={{ width: `${percent}%` }} /></div>
      <div className="profile-media-grid">
        {(["avatar", "banner"] as Purpose[]).map((purpose) => (
          <div key={purpose}>
            <strong>{purpose === "avatar" ? "Avatar" : "Banner"}</strong>
            <div className={`media-preview media-preview-${purpose}`}>
              {images[purpose] ? (
                <Image unoptimized src={images[purpose]!} alt="" fill sizes={purpose === "avatar" ? "160px" : "400px"} />
              ) : <span>Usando imagen de Discord</span>}
            </div>
            <div className="media-actions">
              <label className="ghost-button">
                <Upload size={15} /> {busy === purpose ? "Procesando..." : "Cambiar"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  hidden
                  disabled={Boolean(busy)}
                  onChange={(event) => upload(purpose, event)}
                />
              </label>
              {images[purpose] && (
                <button className="ghost-button" onClick={() => remove(purpose)} disabled={Boolean(busy)}>
                  <Trash2 size={15} /> Quitar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {message && <p className="form-message">{message}</p>}
      <small>JPEG, PNG, WebP o AVIF, máximo 8 MB. Se comprime y cifra antes de guardarse.</small>
    </article>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
