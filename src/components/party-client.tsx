"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Dices, Gamepad2, Play, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { MemberPicker, type PickerMember } from "@/components/member-picker";
import type { CommunityParty, DiceState, TriviaState } from "@/lib/types";

export function PartyClient({
  initialParties,
  directory,
  viewerId,
  wsUrl,
}: {
  initialParties: CommunityParty[];
  directory: PickerMember[];
  viewerId: string;
  wsUrl: string | null;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialParties[0]?.id || "");
  const [liveParty, setLiveParty] = useState<CommunityParty | null>(initialParties[0] || null);
  const [invitee, setInvitee] = useState<PickerMember | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseParty = initialParties.find((party) => party.id === selectedId) || null;
  const selected = liveParty?.id === selectedId && (!baseParty || liveParty.version >= baseParty.version)
    ? liveParty
    : baseParty;
  const connectedPartyId = selected?.isParticipant ? selected.id : null;

  const directoryById = useMemo(
    () => new Map(directory.map((member) => [member.id, member])),
    [directory],
  );

  const inviteCandidates = useMemo(() => {
    const inParty = new Set(selected?.participants.map((member) => member.userId) || []);
    return directory.filter((member) => member.id !== viewerId && !inParty.has(member.id));
  }, [directory, selected, viewerId]);

  const connect = useCallback(async (partyId: string) => {
    if (!wsUrl) return () => {};
    let socket: WebSocket | null = null;
    let stopped = false;
    const open = async () => {
      try {
        const response = await fetch(`/api/community/parties/${partyId}/ticket`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
        });
        const ticket = await response.json();
        if (!response.ok) throw new Error(ticket.error || "No se pudo conectar");
        const target = new URL(ticket.path, wsUrl);
        target.searchParams.set("ticket", ticket.ticket);
        socket = new WebSocket(target);
        socket.onmessage = (event) => {
          const data = JSON.parse(String(event.data)) as { type?: string; party?: CommunityParty };
          if ((data.type === "party.snapshot" || data.type === "party.updated") && data.party) {
            setLiveParty(data.party);
          }
        };
        socket.onclose = () => {
          if (!stopped) retryRef.current = setTimeout(open, 2000);
        };
        socket.onerror = () => socket?.close();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Conexión en vivo no disponible");
        if (!stopped) retryRef.current = setTimeout(open, 4000);
      }
    };
    void open();
    return () => {
      stopped = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      socket?.close();
    };
  }, [wsUrl]);

  useEffect(() => {
    if (!connectedPartyId) return;
    let cleanup = () => {};
    void connect(connectedPartyId).then((result) => { cleanup = result; });
    return () => cleanup();
  }, [connect, connectedPartyId]);

  async function mutate(path: string, body: unknown = {}, method = "POST") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudo actualizar la partida");
      if (payload.party) setLiveParty(payload.party);
      router.refresh();
      return payload;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar la partida");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = await mutate("/api/community/parties", {
      title: data.get("title"), gameType: data.get("gameType"), capacity: Number(data.get("capacity")),
    });
    if (payload?.party) {
      setSelectedId(payload.party.id);
      setCreating(false);
      event.currentTarget.reset();
    }
  }

  async function action(type: "start" | "answer" | "roll", choice?: number) {
    if (!selected) return;
    await mutate(`/api/community/parties/${selected.id}/action`, {
      actionId: crypto.randomUUID(),
      expectedVersion: selected.version,
      type,
      ...(choice === undefined ? {} : { choice }),
    });
  }

  async function inviteSelected() {
    if (!selected || !invitee) return;
    const payload = await mutate(`/api/community/parties/${selected.id}/invite`, { userId: invitee.id });
    if (payload?.party) {
      setInvitee(null);
      setMessage(`${invitee.displayName} entró a la sala.`);
    }
  }

  async function removeParty() {
    if (!selected || selected.ownerId !== viewerId) return;
    if (!window.confirm(`¿Eliminar la sala "${selected.title}"? Esta acción no se puede deshacer.`)) return;
    const payload = await mutate(`/api/community/parties/${selected.id}`, {}, "DELETE");
    if (payload?.deleted) {
      setLiveParty(null);
      const next = initialParties.find((party) => party.id !== selected.id);
      setSelectedId(next?.id || "");
      setMessage("Sala eliminada.");
    }
  }

  return (
    <div className="party-console">
      <section className="party-hero panel">
        <div>
          <span className="eyebrow"><Gamepad2 size={14} /> Salas en vivo</span>
          <h2>Elige un juego y reúne a tu equipo.</h2>
          <p>Crea una sala, añade gente del servidor y arranca cuando estén listos.</p>
          <button className="secondary-button" onClick={() => setCreating((value) => !value)}>
            <Plus size={16} /> {creating ? "Cerrar formulario" : "Crear sala"}
          </button>
        </div>
        <div className="party-orbit" aria-hidden>
          <i><Brain size={18} /></i>
          <i><Dices size={18} /></i>
          <i><Users size={18} /></i>
          <strong>EP</strong>
        </div>
      </section>

      {creating && (
        <form className="panel compact-form party-create-form" onSubmit={create}>
          <input name="title" minLength={3} maxLength={100} placeholder="Nombre de la sala" required />
          <select name="gameType"><option value="trivia">Trivia</option><option value="dice">Dados</option></select>
          <input name="capacity" type="number" min={2} max={20} defaultValue={8} required />
          <button className="secondary-button" disabled={busy}>Crear sala</button>
        </form>
      )}
      {message && <p className="form-message">{message}</p>}

      <section className="party-board">
        <aside className="panel circle-list">
          <div className="panel-heading">
            <div><span className="eyebrow">Partidas</span><h2>Disponibles</h2></div>
          </div>
          {initialParties.map((party) => (
            <button className={selectedId === party.id ? "selected" : ""} key={party.id} onClick={() => setSelectedId(party.id)}>
              <i className={party.gameType === "trivia" ? "circle-violet" : "circle-cyan"}>
                {party.gameType === "trivia" ? <Brain /> : <Dices />}
              </i>
              <span>
                <strong>{party.title}</strong>
                <small>{party.participantCount}/{party.capacity} · {statusLabel(party.status)}</small>
              </span>
            </button>
          ))}
          {!initialParties.length && <div className="empty-card"><Gamepad2 /><p>No hay partidas todavía.</p></div>}
        </aside>

        {selected ? (
          <article className="panel party-detail">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">{selected.gameType === "trivia" ? "Trivia" : "Dados"}</span>
                <h2>{selected.title}</h2>
              </div>
              <b>{statusLabel(selected.status)}</b>
            </div>

            <div className="party-meta">
              <span><Users size={15} /> {selected.participantCount}/{selected.capacity}</span>
              <span>Turno: {memberLabel(selected.turnUserId, directoryById, viewerId)}</span>
            </div>

            <div className="party-participants">
              {selected.participants.map((participant) => {
                const profile = directoryById.get(participant.userId);
                return (
                  <div key={participant.userId}>
                    <span className={`avatar ${profile?.avatarUrl ? "" : "avatar-fallback"}`}>
                      {profile?.avatarUrl ? <Image src={profile.avatarUrl} alt="" width={34} height={34} /> : null}
                    </span>
                    <span>
                      <strong>{profile?.displayName || shortId(participant.userId)}</strong>
                      <small>
                        {participant.userId === selected.ownerId ? "Host" : "Jugador"}
                        {participant.userId === viewerId ? " · tú" : ""}
                      </small>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="circle-manage-actions">
              {!selected.isParticipant && selected.status === "waiting" && (
                <button className="secondary-button" disabled={busy} onClick={() => mutate(`/api/community/parties/${selected.id}/join`)}>
                  Unirme
                </button>
              )}
              {selected.isParticipant && selected.ownerId !== viewerId && selected.status === "waiting" && (
                <button className="ghost-button" disabled={busy} onClick={() => mutate(`/api/community/parties/${selected.id}/join`, {}, "DELETE")}>
                  Salir
                </button>
              )}
              {selected.ownerId === viewerId && selected.status === "waiting" && (
                <button className="secondary-button" disabled={busy || selected.participantCount < 2} onClick={() => action("start")}>
                  <Play size={15} /> Iniciar
                </button>
              )}
              {selected.ownerId === viewerId && (
                <button className="ghost-button danger" disabled={busy} onClick={() => void removeParty()}>
                  <Trash2 size={15} /> Eliminar sala
                </button>
              )}
            </div>

            {selected.ownerId === viewerId && selected.status === "waiting" && (
              <div className="party-invite">
                <div className="panel-heading">
                  <div><span className="eyebrow"><UserPlus size={14} /> Del servidor</span><h2>Añadir jugadores</h2></div>
                </div>
                <MemberPicker
                  members={inviteCandidates}
                  selectedId={invitee?.id || null}
                  onSelect={setInvitee}
                  disabled={busy || selected.participantCount >= selected.capacity}
                  emptyLabel="No quedan miembros disponibles para invitar"
                />
                <button className="secondary-button" disabled={busy || !invitee} onClick={() => void inviteSelected()}>
                  <UserPlus size={16} /> {invitee ? `Añadir a ${invitee.displayName}` : "Selecciona un miembro"}
                </button>
              </div>
            )}

            {selected.gameType === "trivia" && (
              <TriviaGame party={selected} viewerId={viewerId} busy={busy} answer={(choice) => action("answer", choice)} />
            )}
            {selected.gameType === "dice" && (
              <DiceGame
                party={selected}
                viewerId={viewerId}
                busy={busy}
                directoryById={directoryById}
                roll={() => action("roll")}
              />
            )}
            {!wsUrl && <p className="form-message">Configura EYEDBOT_WS_URL para actualizaciones WebSocket.</p>}
          </article>
        ) : (
          <article className="panel empty-card"><Gamepad2 /><h2>Selecciona una sala</h2><p>O crea una nueva para empezar.</p></article>
        )}
      </section>
    </div>
  );
}

function statusLabel(status: CommunityParty["status"]) {
  if (status === "waiting") return "En espera";
  if (status === "active") return "En juego";
  if (status === "completed") return "Terminada";
  return "Cancelada";
}

function shortId(value: string) {
  return value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}

function memberLabel(
  userId: string | null,
  directoryById: Map<string, PickerMember>,
  viewerId: string,
) {
  if (!userId) return "sin iniciar";
  if (userId === viewerId) return "tú";
  return directoryById.get(userId)?.displayName || shortId(userId);
}

function TriviaGame({ party, viewerId, busy, answer }: { party: CommunityParty; viewerId: string; busy: boolean; answer: (choice: number) => void }) {
  const state = party.state as TriviaState;
  const answered = state.answeredUserIds?.includes(viewerId);
  if (party.status === "waiting") return <p className="party-wait">Esperando a que el host inicie la partida.</p>;
  if (party.status === "cancelled") return <p className="party-wait">Esta sala fue eliminada.</p>;
  return (
    <div className="challenge-list party-game">
      <h3>{state.prompt}</h3>
      {state.choices?.map((choice, index) => (
        <button
          className="ghost-button"
          key={choice}
          disabled={busy || party.turnUserId !== viewerId || answered}
          onClick={() => answer(index)}
        >
          {choice}
        </button>
      ))}
      <p>Respondieron: {state.answeredUserIds?.length || 0}</p>
    </div>
  );
}

function DiceGame({
  party,
  viewerId,
  busy,
  directoryById,
  roll,
}: {
  party: CommunityParty;
  viewerId: string;
  busy: boolean;
  directoryById: Map<string, PickerMember>;
  roll: () => void;
}) {
  const state = party.state as DiceState;
  if (party.status === "waiting") return <p className="party-wait">Esperando a que el host inicie la partida.</p>;
  if (party.status === "cancelled") return <p className="party-wait">Esta sala fue eliminada.</p>;
  return (
    <div className="party-game">
      <button
        className="secondary-button"
        disabled={busy || party.turnUserId !== viewerId || state.rolls?.[viewerId] !== undefined}
        onClick={roll}
      >
        <Dices /> Lanzar dado
      </button>
      <div className="mini-stats">
        {Object.entries(state.rolls || {}).map(([userId, value]) => (
          <div key={userId}>
            <span>{memberLabel(userId, directoryById, viewerId)}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
