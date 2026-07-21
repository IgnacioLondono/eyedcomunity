"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Camera, Image as ImageIcon, LogOut, Plus, Send, Trash2, UserPlus, Users } from "lucide-react";
import { MemberPicker, type PickerMember } from "@/components/member-picker";

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

type CircleMember = {
  userId: string;
  role: string;
  displayName: string;
  joinedAt: string;
};

export function CircleClient({
  initialCircles,
  initialPosts,
  directory,
  viewerId,
}: {
  initialCircles: Circle[];
  initialPosts: Post[];
  directory: PickerMember[];
  viewerId: string;
}) {
  const [circles, setCircles] = useState(initialCircles);
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCircle, setSelectedCircle] = useState(initialCircles[0]?.id || "");
  const [circleMembers, setCircleMembers] = useState<CircleMember[]>([]);
  const [selectedInvitee, setSelectedInvitee] = useState<PickerMember | null>(null);
  const [showCircleForm, setShowCircleForm] = useState(false);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selected = circles.find((circle) => circle.id === selectedCircle);

  const directoryById = useMemo(
    () => new Map(directory.map((member) => [member.id, member])),
    [directory],
  );

  const inviteCandidates = useMemo(() => {
    const memberIds = new Set(circleMembers.map((member) => member.userId));
    return directory.filter((member) => member.id !== viewerId && !memberIds.has(member.id));
  }, [circleMembers, directory, viewerId]);

  useEffect(() => {
    if (!selectedCircle) {
      setCircleMembers([]);
      return;
    }
    let cancelled = false;
    void fetch(`/api/circles/${selectedCircle}/members`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "No se pudieron cargar los miembros");
        if (!cancelled) setCircleMembers(body.members || []);
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "No se pudieron cargar los miembros");
      });
    return () => { cancelled = true; };
  }, [selectedCircle]);

  async function refresh() {
    const response = await fetch("/api/circles", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "No se pudo actualizar");
    setCircles(body.circles);
    setPosts(body.posts);
    if (selectedCircle && !body.circles.some((circle: Circle) => circle.id === selectedCircle)) {
      setSelectedCircle(body.circles[0]?.id || "");
    } else if (!selectedCircle && body.circles[0]) {
      setSelectedCircle(body.circles[0].id);
    }
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

  async function inviteSelected() {
    if (!selectedCircle || !selectedInvitee) return setMessage("Selecciona a alguien de la lista.");
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/circles/${selectedCircle}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedInvitee.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setCircleMembers(body.members || []);
      setSelectedInvitee(null);
      setMessage(`${selectedInvitee.displayName} se unió al círculo.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo añadir");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string, displayName: string) {
    if (!selectedCircle) return;
    if (!window.confirm(`¿Quitar a ${displayName} del círculo?`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/circles/${selectedCircle}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setCircleMembers(body.members || []);
      setMessage(`${displayName} fue eliminado del círculo.`);
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar el miembro");
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

  async function destroyCircle() {
    if (!selected || selected.role !== "owner") return;
    if (!window.confirm(`¿Eliminar el círculo "${selected.name}"? Se borrarán sus publicaciones.`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/circles/${selected.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setMessage("Círculo eliminado.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo eliminar el círculo");
    } finally {
      setBusy(false);
    }
  }

  async function leaveSelectedCircle() {
    if (!selected || selected.role === "owner") return;
    if (!window.confirm(`¿Salir de "${selected.name}"?`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/circles/${selected.id}?action=leave`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setMessage("Saliste del círculo.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo salir del círculo");
    } finally {
      setBusy(false);
    }
  }

  const visiblePosts = useMemo(
    () => posts.filter((post) => !selectedCircle || post.circleId === selectedCircle),
    [posts, selectedCircle],
  );

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
        <article className="panel" id="circle-manager">
          <div className="panel-heading">
            <div><span className="eyebrow">Tus círculos</span><h2>Grupos privados</h2></div>
            <button onClick={() => setShowCircleForm((value) => !value)} aria-label="Crear círculo"><Plus size={18} /></button>
          </div>
          {(showCircleForm || circles.length === 0) && (
            <form className="compact-form" id="create-circle" onSubmit={createCircle}>
              <input name="name" placeholder="Nombre" minLength={2} maxLength={80} required />
              <input name="description" placeholder="Descripción opcional" maxLength={240} />
              <button className="secondary-button" disabled={busy}>
                <Plus size={16} /> {busy ? "Creando..." : circles.length === 0 ? "Crear primer círculo" : "Crear círculo"}
              </button>
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
                <span><strong>{circle.name}</strong><small>{circle.memberCount} miembros · {circle.role === "owner" ? "dueño" : "miembro"}</small></span>
              </button>
            ))}
          </div>
          {selected ? (
            <div className="circle-manage-actions">
              {selected.role === "owner" ? (
                <button className="ghost-button danger" disabled={busy} onClick={() => void destroyCircle()}>
                  <Trash2 size={16} /> Eliminar círculo
                </button>
              ) : (
                <button className="ghost-button" disabled={busy} onClick={() => void leaveSelectedCircle()}>
                  <LogOut size={16} /> Salir del círculo
                </button>
              )}
            </div>
          ) : null}
        </article>

        {selected && (
          <article className="panel circle-members-panel">
            <div className="panel-heading">
              <div><span className="eyebrow"><Users size={14} /> Miembros</span><h2>{selected.name}</h2></div>
              <strong>{circleMembers.length}</strong>
            </div>
            <div className="circle-member-list">
              {circleMembers.map((member) => {
                const profile = directoryById.get(member.userId);
                return (
                  <div className="circle-member-row" key={member.userId}>
                    <span className={`avatar ${profile?.avatarUrl ? "" : "avatar-fallback"}`}>
                      {profile?.avatarUrl ? <Image src={profile.avatarUrl} alt="" width={34} height={34} /> : null}
                    </span>
                    <span>
                      <strong>{profile?.displayName || member.displayName}</strong>
                      <small>{member.role === "owner" ? "Dueño" : "Miembro"}{profile ? ` · @${profile.username}` : ""}</small>
                    </span>
                    {selected.role === "owner" && member.role !== "owner" ? (
                      <button
                        className="ghost-button danger"
                        disabled={busy}
                        onClick={() => void removeMember(member.userId, profile?.displayName || member.displayName)}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </article>
        )}

        {selected?.role === "owner" && (
          <article className="panel">
            <div className="panel-heading">
              <div><span className="eyebrow"><UserPlus size={14} /> Añadir del servidor</span><h2>Invitar amigos</h2></div>
            </div>
            <MemberPicker
              members={inviteCandidates}
              selectedId={selectedInvitee?.id || null}
              onSelect={setSelectedInvitee}
              disabled={busy}
              emptyLabel="Todos los miembros visibles ya están en el círculo"
            />
            <button className="secondary-button" disabled={busy || !selectedInvitee} onClick={() => void inviteSelected()}>
              <UserPlus size={16} /> {selectedInvitee ? `Añadir a ${selectedInvitee.displayName}` : "Selecciona un miembro"}
            </button>
          </article>
        )}
      </aside>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
