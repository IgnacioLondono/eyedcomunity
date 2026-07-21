"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import type { CommunityPlan, PlanStatus } from "@/lib/types";

export function PlansClient({ plans, viewerId }: { plans: CommunityPlan[]; viewerId: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [inviteeId, setInviteeId] = useState<Record<string, string>>({});

  async function send(path: string, method: string, body: unknown = {}) {
    setBusy(path);
    setMessage("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo actualizar el plan");
      router.refresh();
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el plan");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startsAt = new Date(String(form.get("startsAt")));
    const endsRaw = String(form.get("endsAt") || "");
    const ok = await send("/api/community/plans", "POST", {
      title: form.get("title"),
      description: form.get("description"),
      location: form.get("location"),
      capacity: Number(form.get("capacity")),
      startsAt: startsAt.toISOString(),
      endsAt: endsRaw ? new Date(endsRaw).toISOString() : null,
      visibility: form.get("visibility"),
      status: "upcoming",
    });
    if (ok) {
      event.currentTarget.reset();
      setCreating(false);
    }
  }

  return (
    <>
      <div className="section-title">
        <div><span className="eyebrow">Agenda real</span><h2>Planes de la comunidad</h2></div>
        <button className="secondary-button" onClick={() => setCreating((value) => !value)}><Plus size={17} /> Crear plan</button>
      </div>
      {creating && (
        <form className="panel compact-form" onSubmit={create}>
          <input name="title" placeholder="Título" minLength={3} maxLength={120} required />
          <textarea name="description" placeholder="Descripción" maxLength={2000} />
          <input name="location" placeholder="Lugar" maxLength={200} />
          <input name="capacity" type="number" min={2} max={500} defaultValue={12} required />
          <label>Inicio <input name="startsAt" type="datetime-local" required /></label>
          <label>Fin <input name="endsAt" type="datetime-local" /></label>
          <select name="visibility" defaultValue="guild"><option value="guild">Servidor</option><option value="private">Privado</option></select>
          <button className="secondary-button" disabled={Boolean(busy)}>Publicar</button>
        </form>
      )}
      {message && <p className="form-message">{message}</p>}
      <section className="challenge-list">
        {plans.map((plan) => {
          const closed = plan.status === "completed" || plan.status === "cancelled";
          return (
            <article className="panel challenge-card" key={plan.id}>
              <div className="challenge-icon"><CalendarDays /></div>
              <div>
                <h3>{plan.title}</h3><p>{plan.description || "Sin descripción"}</p>
                <small><MapPin size={13} /> {plan.location || "Por definir"} · {new Date(plan.startsAt).toLocaleString("es")}</small>
                <small><Users size={13} /> {plan.attendeeCount}/{plan.capacity} · {plan.visibility}</small>
              </div>
              <div className="media-actions">
                {!closed && plan.invitationStatus === "pending" && (
                  <>
                    <button className="secondary-button" disabled={Boolean(busy)} onClick={() => send(`/api/community/plans/${plan.id}/invitations/accept`, "POST")}>Aceptar invitación</button>
                    <button className="ghost-button" disabled={Boolean(busy)} onClick={() => send(`/api/community/plans/${plan.id}/invitations/reject`, "POST")}>Rechazar</button>
                  </>
                )}
                {!closed && !plan.isAttendee && plan.invitationStatus !== "pending" && (
                  <button className="secondary-button" disabled={Boolean(busy)} onClick={() => send(`/api/community/plans/${plan.id}/join`, "POST")}>Unirme</button>
                )}
                {!closed && plan.isAttendee && plan.ownerId !== viewerId && (
                  <button className="ghost-button" disabled={Boolean(busy)} onClick={() => send(`/api/community/plans/${plan.id}/join`, "DELETE")}>Salir</button>
                )}
                {plan.canManage && !closed && (
                  <>
                    <div className="inline-form">
                      <input
                        aria-label="ID de Discord del invitado"
                        placeholder="ID de Discord"
                        value={inviteeId[plan.id] || ""}
                        onChange={(event) => setInviteeId((current) => ({ ...current, [plan.id]: event.target.value }))}
                      />
                      <button
                        className="ghost-button"
                        disabled={Boolean(busy) || !/^\d{10,25}$/.test(inviteeId[plan.id] || "")}
                        onClick={() => send(`/api/community/plans/${plan.id}/invitations`, "POST", { userId: inviteeId[plan.id] })}
                      >Invitar</button>
                    </div>
                    <select
                      aria-label="Cambiar estado"
                      value={plan.status}
                      disabled={Boolean(busy)}
                      onChange={(event) => send(`/api/community/plans/${plan.id}/status`, "PATCH", { status: event.target.value as PlanStatus })}
                    >
                      <option value="upcoming">Próximo</option><option value="active">Activo</option>
                      <option value="completed">Completado</option><option value="cancelled">Cancelado</option>
                    </select>
                  </>
                )}
                <b>{plan.status}</b>
              </div>
            </article>
          );
        })}
        {plans.length === 0 && <div className="empty-card"><CalendarDays /><h3>Aún no hay quedadas</h3><p>Crea el primer plan real de la comunidad.</p></div>}
      </section>
    </>
  );
}
