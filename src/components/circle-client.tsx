"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { Camera, Image as ImageIcon, Plus, Send, Trash2, UserPlus, Users } from "lucide-react";

type Circle = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  role: string;
  memberCount: number;
};

type Post = {
  id: string;
  circleId: string;
  circleName: string;
  authorId: string;
  authorName: string;
  authorAvatarId: string | null;
  content: string;
  mediaId: string | null;
  createdAt: string;
};

export function CircleClient({
  initialCircles,
  initialPosts,
  viewerId,
}: {
  initialCircles: Circle[];
  initialPosts: Post[];
  viewerId: string;
}) {
  const [circles, setCircles] = useState(initialCircles);
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCircle, setSelectedCircle] = useState(initialCircles[0]?.id || "");
  const [showCircleForm, setShowCircleForm] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selected = circles.find((circle) => circle.id === selectedCircle);
  const visiblePosts = useMemo(
    () => posts.filter((post) => !selectedCircle || post.circleId === selectedCircle),
    [posts, selectedCircle],
  );

  async function refresh() {
    const response = await fetch("/api/circles", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "No se pudo actualizar");
    setCircles(body.circles);
    setPosts(body.posts);
    if (!selectedCircle && body.circles[0]) setSelectedCircle(body.circles[0].id);
  }

  async function createCircle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.get("name"), description: data.get("description") }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      await refresh();
      setSelectedCircle(body.circle.id);
      setShowCircleForm(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo crear el círculo");
    } finally {
      setBusy(false);
    }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCircle) return setMessage("Primero crea o selecciona un círculo.");
    setBusy(true);
    setMessage("");
    const data = new FormData();
    data.set("content", content);
    if (file) data.set("file", file);
    try {
      const response = await fetch(`/api/circles/${selectedCircle}/posts`, { method: "POST", body: data });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setContent("");
      setFile(null);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo publicar");
    } finally {
      setBusy(false);
    }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCircle) return setMessage("Esta acción no está disponible.");
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const response = await fetch(`/api/circles/${selectedCircle}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.get("userId") }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      event.currentTarget.reset();
      setMessage("Miembro añadido.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo añadir");
    } finally {
      setBusy(false);
    }
  }

  async function removePost(id: string) {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setPosts((current) => current.filter((post) => post.id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="circle-layout">
      <div className="feed">
        <form className="composer panel circle-composer" onSubmit={publish}>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={selected ? `Comparte algo con ${selected.name}...` : "Crea un círculo para comenzar..."}
            maxLength={2000}
            disabled={busy || !selectedCircle}
          />
          <label className="ghost-button">
            <ImageIcon size={18} /> {file ? file.name : "Foto"}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" hidden onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <button className="secondary-button" disabled={busy || !selectedCircle}>
            <Send size={17} /> Publicar
          </button>
        </form>
        {message && <p className="form-message">{message}</p>}

        {visiblePosts.map((post) => (
          <article className="post panel" key={post.id}>
            <header>
              {post.authorAvatarId ? (
                <Image unoptimized src={`/api/media/${post.authorAvatarId}`} alt="" width={42} height={42} className="avatar" />
              ) : <span className="avatar avatar-fallback" />}
              <div><strong>{post.authorName}</strong><small>{formatDate(post.createdAt)} · {post.circleName}</small></div>
              {post.authorId === viewerId && (
                <button className="post-delete" onClick={() => removePost(post.id)} aria-label="Eliminar publicación">
                  <Trash2 size={16} />
                </button>
              )}
            </header>
            {post.content && <p>{post.content}</p>}
            {post.mediaId && (
              <div className="circle-photo">
                <Image unoptimized src={`/api/media/${post.mediaId}`} alt="Imagen de la publicación" fill sizes="(max-width: 900px) 100vw, 700px" />
              </div>
            )}
          </article>
        ))}
        {visiblePosts.length === 0 && (
          <div className="empty-card"><Camera /><h2>Aún no hay publicaciones</h2><p>Comparte el primer recuerdo de este círculo.</p></div>
        )}
      </div>

      <aside className="circle-aside">
        <article className="panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Tus círculos</span><h2>Grupos privados</h2></div>
            <button onClick={() => setShowCircleForm((value) => !value)} aria-label="Crear círculo"><Plus size={18} /></button>
          </div>
          {showCircleForm && (
            <form className="compact-form" onSubmit={createCircle}>
              <input name="name" placeholder="Nombre" minLength={2} maxLength={80} required />
              <input name="description" placeholder="Descripción opcional" maxLength={240} />
              <button className="secondary-button" disabled={busy}>Crear</button>
            </form>
          )}
          <div className="circle-list">
            {circles.map((circle, index) => (
              <button
                className={selectedCircle === circle.id ? "selected" : ""}
                onClick={() => setSelectedCircle(circle.id)}
                key={circle.id}
              >
                <i className={["circle-violet", "circle-cyan", "circle-rose"][index % 3]}><Users /></i>
                <span><strong>{circle.name}</strong><small>{circle.memberCount} miembros</small></span>
              </button>
            ))}
          </div>
        </article>
        {selected?.role === "owner" && (
          <article className="panel">
            <span className="eyebrow"><UserPlus size={14} /> Añadir miembro</span>
            <form className="compact-form" onSubmit={invite}>
              <input name="userId" placeholder="ID de Discord" pattern="\d{10,25}" required />
              <button className="ghost-button" disabled={busy}>Invitar</button>
            </form>
          </article>
        )}
      </aside>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
