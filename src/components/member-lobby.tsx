"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Clock3, MessageCircle, Search } from "lucide-react";
import type { CommunityMemberSummary } from "@/lib/types";

type StatusFilter = "all" | "connected" | "online" | "idle" | "dnd" | "offline";

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "connected", label: "Conectados" },
  { id: "online", label: "En línea" },
  { id: "idle", label: "Ausentes" },
  { id: "dnd", label: "No molestar" },
  { id: "offline", label: "Desconectados" },
];

export function MemberLobby({ members }: { members: CommunityMemberSummary[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return members.filter((member) => {
      const matchesQuery = !normalized ||
        member.displayName.toLowerCase().includes(normalized) ||
        member.username.toLowerCase().includes(normalized) ||
        member.activity?.toLowerCase().includes(normalized);
      return matchesQuery && matchesStatus(member.status, statusFilter);
    });
  }, [members, query, statusFilter]);

  return (
    <>
      <div className="lobby-toolbar panel">
        <label>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o actividad..."
          />
        </label>
        <div className="lobby-status-filters" role="group" aria-label="Filtrar por estado">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={statusFilter === filter.id ? "selected" : ""}
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.id !== "all" && filter.id !== "connected" && (
                <i className={`status-dot status-${filter.id === "offline" ? "offline" : filter.id}`} />
              )}
              {filter.label}
            </button>
          ))}
        </div>
        <span>{visible.length} miembros</span>
      </div>

      <section className="member-grid">
        {visible.map((member) => (
          <Link href={`/members/${member.id}`} className="member-card panel" key={member.id}>
            <div className="member-cover" style={coverStyle(member.bannerUrl, member.accentColor)} />
            <div className={`member-avatar avatar ${member.avatarUrl ? "" : "avatar-fallback"}`}>
              {member.avatarUrl && (
                <Image src={member.avatarUrl} alt="" width={64} height={64} />
              )}
              <i className={`status-dot status-${member.status}`} />
            </div>
            <span className="member-rank">#{member.rank || "—"}</span>
            <h2>{member.displayName}</h2>
            <p>@{member.username}</p>
            <div className="member-presence">
              <i className={`status-dot status-${member.status}`} />
              {member.activity || statusLabel(member.status)}
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
        <div className="empty-card">
          <h2>No encontramos a nadie</h2>
          <p>Prueba con otro nombre o cambia el filtro de estado.</p>
        </div>
      )}
    </>
  );
}

function matchesStatus(status: CommunityMemberSummary["status"], filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "connected") return status !== "offline";
  return status === filter;
}

function statusLabel(status: CommunityMemberSummary["status"]) {
  if (status === "online") return "En línea";
  if (status === "idle") return "Ausente";
  if (status === "dnd") return "No molestar";
  return "Desconectado";
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("es", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function coverStyle(bannerUrl: string | null, accentColor: string | null) {
  if (bannerUrl) {
    return {
      backgroundImage: `linear-gradient(180deg, transparent, rgba(10, 9, 14, .28)), url("${bannerUrl}")`,
    };
  }
  if (accentColor) {
    return { background: `linear-gradient(135deg, ${accentColor}, #111018)` };
  }
  return undefined;
}
