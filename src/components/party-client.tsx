"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Dices, Gamepad2, Play, Plus, Users } from "lucide-react";
import type { CommunityParty, DiceState, TriviaState } from "@/lib/types";

export function PartyClient({
  initialParties,
  viewerId,
  wsUrl,
}: {
  initialParties: CommunityParty[];
  viewerId: string;
  wsUrl: string | null;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(initialParties[0]?.id || "");
  const [liveParty, setLiveParty] = useState<CommunityParty | null>(initialParties[0] || null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseParty = initialParties.find((party) => party.id === selectedId) || null;
  const selected = liveParty?.id === selectedId && (!baseParty || liveParty.version >= baseParty.version)
    ? liveParty
    : baseParty;
  const connectedPartyId = selected?.isParticipant ? selected.id : null;

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

  return (
    <>
      <div className="section-title">
        <div><span className="eyebrow">Salas persistentes</span><h2>Partidas disponibles</h2></div>
        <button className="secondary-button" onClick={() => setCreating((value) => !value)}><Plus size={16} /> Crear sala</button>
      </div>
      {creating && <form className="panel compact-form" onSubmit={create}>
        <input name="title" minLength={3} maxLength={100} placeholder="Nombre de la sala" required />
        <select name="gameType"><option value="trivia">Trivia</option><option value="dice">Dados</option></select>
        <input name="capacity" type="number" min={2} max={20} defaultValue={8} required />
        <button className="secondary-button" disabled={busy}>Crear</button>
      </form>}
      {message && <p className="form-message">{message}</p>}
      <section className="split-grid">
        <aside className="panel circle-list">
          {initialParties.map((party) => (
            <button className={selectedId === party.id ? "selected" : ""} key={party.id} onClick={() => setSelectedId(party.id)}>
              <i className={party.gameType === "trivia" ? "circle-violet" : "circle-cyan"}>{party.gameType === "trivia" ? <Brain /> : <Dices />}</i>
              <span><strong>{party.title}</strong><small>{party.participantCount}/{party.capacity} · {party.status}</small></span>
            </button>
          ))}
          {!initialParties.length && <div className="empty-card"><Gamepad2 /><p>No hay partidas todavía.</p></div>}
        </aside>
        {selected && <article className="panel">
          <div className="panel-heading"><div><span className="eyebrow">{selected.gameType}</span><h2>{selected.title}</h2></div><b>v{selected.version}</b></div>
          <p><Users size={15} /> {selected.participantCount} participantes · turno: {selected.turnUserId || "sin iniciar"}</p>
          {!selected.isParticipant && selected.status === "waiting" && (
            <button className="secondary-button" disabled={busy} onClick={() => mutate(`/api/community/parties/${selected.id}/join`)}>Unirme</button>
          )}
          {selected.isParticipant && selected.ownerId !== viewerId && selected.status === "waiting" && (
            <button className="ghost-button" disabled={busy} onClick={() => mutate(`/api/community/parties/${selected.id}/join`, {}, "DELETE")}>Salir</button>
          )}
          {selected.ownerId === viewerId && selected.status === "waiting" && (
            <button className="secondary-button" disabled={busy || selected.participantCount < 2} onClick={() => action("start")}><Play size={15} /> Iniciar</button>
          )}
          {selected.gameType === "trivia" && <TriviaGame party={selected} viewerId={viewerId} busy={busy} answer={(choice) => action("answer", choice)} />}
          {selected.gameType === "dice" && <DiceGame party={selected} viewerId={viewerId} busy={busy} roll={() => action("roll")} />}
          {!wsUrl && <p className="form-message">Configura EYEDBOT_WS_URL para actualizaciones WebSocket.</p>}
        </article>}
      </section>
    </>
  );
}

function TriviaGame({ party, viewerId, busy, answer }: { party: CommunityParty; viewerId: string; busy: boolean; answer: (choice: number) => void }) {
  const state = party.state as TriviaState;
  const answered = state.answeredUserIds?.includes(viewerId);
  if (party.status === "waiting") return <p>Esperando a que el owner inicie.</p>;
  return <div className="challenge-list"><h3>{state.prompt}</h3>{state.choices?.map((choice, index) => (
    <button className="ghost-button" key={choice} disabled={busy || party.turnUserId !== viewerId || answered} onClick={() => answer(index)}>{choice}</button>
  ))}<p>Respondieron: {state.answeredUserIds?.length || 0}</p></div>;
}

function DiceGame({ party, viewerId, busy, roll }: { party: CommunityParty; viewerId: string; busy: boolean; roll: () => void }) {
  const state = party.state as DiceState;
  if (party.status === "waiting") return <p>Esperando a que el owner inicie.</p>;
  return <div><button className="secondary-button" disabled={busy || party.turnUserId !== viewerId || state.rolls?.[viewerId] !== undefined} onClick={roll}><Dices /> Lanzar dado</button>
    <div className="mini-stats">{Object.entries(state.rolls || {}).map(([userId, value]) => <div key={userId}><span>{userId === viewerId ? "Tú" : userId}</span><strong>{value}</strong></div>)}</div>
  </div>;
}
