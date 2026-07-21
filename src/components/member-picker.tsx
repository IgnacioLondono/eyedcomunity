"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export type PickerMember = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status?: string;
};

export function MemberPicker({
  members,
  excludeIds = [],
  selectedId,
  onSelect,
  disabled = false,
  placeholder = "Buscar miembro del servidor...",
  emptyLabel = "No hay miembros disponibles",
}: {
  members: PickerMember[];
  excludeIds?: string[];
  selectedId: string | null;
  onSelect: (member: PickerMember | null) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return members.filter((member) => {
      if (excluded.has(member.id)) return false;
      if (!normalized) return true;
      return member.displayName.toLowerCase().includes(normalized)
        || member.username.toLowerCase().includes(normalized);
    });
  }, [excluded, members, query]);

  return (
    <div className={`member-picker ${disabled ? "disabled" : ""}`}>
      <label className="member-picker-search">
        <Search size={15} />
        <input
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      <div className="member-picker-list" role="listbox" aria-label="Miembros del servidor">
        {visible.map((member) => {
          const selected = selectedId === member.id;
          return (
            <button
              key={member.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={selected ? "selected" : ""}
              disabled={disabled}
              onClick={() => onSelect(selected ? null : member)}
            >
              <span className={`avatar ${member.avatarUrl ? "" : "avatar-fallback"}`}>
                {member.avatarUrl ? (
                  <Image src={member.avatarUrl} alt="" width={32} height={32} />
                ) : null}
                {member.status ? <i className={`status-dot status-${member.status}`} /> : null}
              </span>
              <span>
                <strong>{member.displayName}</strong>
                <small>@{member.username}</small>
              </span>
            </button>
          );
        })}
        {visible.length === 0 ? <p>{emptyLabel}</p> : null}
      </div>
    </div>
  );
}
