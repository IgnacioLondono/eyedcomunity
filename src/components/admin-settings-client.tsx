"use client";

import { useState } from "react";
import { Bell, Construction, Power } from "lucide-react";
import type { CommunityFeatureKey, CommunitySettings } from "@/lib/types";

const featureLabels: Record<CommunityFeatureKey, string> = {
  activity: "Actividad",
  achievements: "Logros",
  wrapped: "Wrapped",
  server: "Servidor",
  lobby: "Lobby",
  ranking: "Ranking",
  circle: "EyedCircle",
  plans: "Quedadas",
  party: "EyedParty",
  challenges: "Retos",
};

export function AdminSettingsClient({ initialSettings }: { initialSettings: CommunitySettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function update(key: string, patch: object) {
    setSaving(key);
    setMessage("");
    try {
      const response = await fetch("/api/community/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo guardar");
      setSettings(body.settings);
      setMessage("Configuración guardada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="admin-settings-grid">
      <section className="panel admin-setting-card">
        <Construction />
        <div><h2>Modo mantenimiento</h2><p>Bloquea todo el portal para miembros; el administrador conserva acceso.</p></div>
        <Toggle
          checked={settings.maintenance}
          disabled={saving !== null}
          onChange={(value) => update("maintenance", { maintenance: value })}
        />
      </section>

      <section className="panel admin-setting-card">
        <Bell />
        <div><h2>Avisos de logros</h2><p>Activa o desactiva mensajes de logros en Discord sin quitar premios.</p></div>
        <Toggle
          checked={settings.achievementNotifications}
          disabled={saving !== null}
          onChange={(value) => update("notifications", { achievementNotifications: value })}
        />
      </section>

      <section className="panel admin-features">
        <div className="panel-heading">
          <div><span className="eyebrow">Módulos del portal</span><h2>Funciones disponibles</h2></div>
          <Power />
        </div>
        {Object.entries(featureLabels).map(([key, label]) => {
          const feature = key as CommunityFeatureKey;
          return (
            <label key={feature}>
              <span>{label}</span>
              <Toggle
                checked={settings.features[feature]}
                disabled={saving !== null}
                onChange={(value) => update(feature, { features: { [feature]: value } })}
              />
            </label>
          );
        })}
      </section>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`admin-toggle ${checked ? "enabled" : ""}`}
      disabled={disabled}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span />
      {checked ? "Activo" : "Desactivado"}
    </button>
  );
}
