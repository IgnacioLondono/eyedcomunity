"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock3, MessageCircle, Search, SlidersHorizontal } from "lucide-react";
import type { CommunityMemberSummary } from "@/lib/types";

export function MemberLobby({ members }: { members: CommunityMemberSummary[] }) {
  const [query, setQuery] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return members.filter((member) => {
      const matches = !normalized ||
        member.displayName.toLowerCase().includes(normalized) ||
        member.username.toLowerCase().includes(normalized) ||
        member.activity?.toLowerCase().includes(normalized);
      return matches && (!onlineOnly || member.status !== "offline");
    });
  }, [members, onlineOnly, query]);

  return (
    <>
      <div className="lobby-toolbar panel">
        <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o actividad..." /></label>
        <button className={onlineOnly ? "selected" : ""} onClick={() => setOnlineOnly((value) => !value)}>
          <SlidersHorizontal size={16} /> Solo conectados
        </button>
        <span>{visible.length} miembros</span>
      </div>

      <section className="member-grid">
        {visible.map((member) => (
          <Link href={`/members/${member.id}`} className="member-card panel" key={member.id}>
            <div className="member-cover" />
            <div className="member-avatar avatar avatar-fallback">
              <i className={`status-dot status-${member.status}`} />
            </div>
            <span className="member-rank">#{member.rank || "—"}</span>
            <h2>{member.displayName}</h2>
            <p>@{member.username}</p>
            <div className="member-presence">
              <i className={`status-dot status-${member.status}`} />
              {member.activity || (member.status === "offline" ? "Desconectado" : "En línea")}
            </div>
            <div className="member-card-stats">
              <span><strong>{member.level}</strong>Nivel</span>
              <span><strong>{formatCompact(member.messages)}</strong><MessageCircle /> Mensajes</span>
              <span><strong>{Math.round(member.voiceMinutes / 60)}h</strong><Clock3 /> Voz</span>
            </div>
            <b>Ver perfil</b>
          </Link>
        ))}
      </section>

      {visible.length === 0 && (
        <div className="empty-card"><h2>No encontramos a nadie</h2><p>Prueba con otro nombre o desactiva el filtro.</p></div>
      )}
    </>
  );
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
