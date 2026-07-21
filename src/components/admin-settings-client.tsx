"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Award,
  Bell,
  CalendarDays,
  Check,
  Construction,
  Gift,
  LayoutDashboard,
  PartyPopper,
  Power,
  Radio,
  RotateCcw,
  Save,
  Server,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import type { CommunityFeatureKey, CommunitySettings } from "@/lib/types";

const featureMeta: Record<CommunityFeatureKey, { label: string; description: string; icon: typeof Activity }> = {
  activity: { label: "Actividad", description: "Historial diario de mensajes y voz.", icon: Activity },
  achievements: { label: "Logros", description: "Progreso y recompensas desbloqueables.", icon: Award },
  wrapped: { label: "Wrapped", description: "Resumen anual compartible.", icon: Sparkles },
  server: { label: "Servidor", description: "Métricas generales del guild.", icon: Server },
  lobby: { label: "Lobby", description: "Directorio de miembros y presencia.", icon: Users },
  ranking: { label: "Ranking", description: "Clasificaciones por XP, mensajes y voz.", icon: Trophy },
  circle: { label: "EyedCircle", description: "Espacio privado entre amigos.", icon: Radio },
  plans: { label: "Quedadas", description: "Planes y quedadas de la comunidad.", icon: CalendarDays },
  party: { label: "EyedParty", description: "Salas y partidas colaborativas.", icon: PartyPopper },
  challenges: { label: "Retos", description: "Desafíos semanales con premios.", icon: Gift },
  shop: { label: "Tienda", description: "Catálogo de productos con EyedCoins.", icon: ShoppingBag },
};

function cloneSettings(settings: CommunitySettings): CommunitySettings {
  return {
    ...settings,
    features: { ...settings.features },
  };
}

function settingsEqual(left: CommunitySettings, right: CommunitySettings) {
  if (left.maintenance !== right.maintenance) return false;
  if (left.achievementNotifications !== right.achievementNotifications) return false;
  return (Object.keys(featureMeta) as CommunityFeatureKey[]).every(
    (key) => left.features[key] === right.features[key],
  );
}

export function AdminSettingsClient({ initialSettings }: { initialSettings: CommunitySettings }) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => cloneSettings(initialSettings));
  const [draft, setDraft] = useState(() => cloneSettings(initialSettings));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);

  const dirty = useMemo(() => !settingsEqual(draft, saved), [draft, saved]);
  const enabledCount = useMemo(
    () => Object.values(draft.features).filter(Boolean).length,
    [draft.features],
  );

  function setFeature(feature: CommunityFeatureKey, value: boolean) {
    setDraft((current) => ({
      ...current,
      features: { ...current.features, [feature]: value },
    }));
    setMessage(null);
  }

  function discard() {
    setDraft(cloneSettings(saved));
    setMessage({ tone: "info", text: "Cambios descartados." });
  }

  async function applyChanges() {
    if (!dirty || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/community/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maintenance: draft.maintenance,
          achievementNotifications: draft.achievementNotifications,
          features: draft.features,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo aplicar la configuración");
      const next = cloneSettings(body.settings);
      setSaved(next);
      setDraft(next);
      setMessage({ tone: "ok", text: "Cambios aplicados. El portal ya está usando esta configuración." });
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "No se pudo aplicar la configuración",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-console">
      <section className="admin-overview panel">
        <div>
          <span className="eyebrow"><LayoutDashboard size={14} /> Resumen</span>
          <h2>Estado del portal</h2>
          <p>Ajusta los módulos y pulsa aplicar para que surtan efecto en toda la comunidad.</p>
        </div>
        <div className="admin-overview-stats">
          <div>
            <strong>{enabledCount}/{Object.keys(featureMeta).length}</strong>
            <span>Módulos activos</span>
          </div>
          <div>
            <strong className={draft.maintenance ? "danger" : "ok"}>
              {draft.maintenance ? "ON" : "OFF"}
            </strong>
            <span>Mantenimiento</span>
          </div>
          <div>
            <strong className={draft.achievementNotifications ? "ok" : ""}>
              {draft.achievementNotifications ? "ON" : "OFF"}
            </strong>
            <span>Avisos Discord</span>
          </div>
        </div>
      </section>

      <section className="admin-system-grid">
        <article className={`panel admin-system-card ${draft.maintenance ? "warn" : ""}`}>
          <div className="admin-system-copy">
            <Construction />
            <div>
              <h2>Modo mantenimiento</h2>
              <p>Bloquea el portal para miembros. Tú sigues teniendo acceso como administrador.</p>
            </div>
          </div>
          <Toggle
            checked={draft.maintenance}
            disabled={saving}
            onChange={(value) => {
              setDraft((current) => ({ ...current, maintenance: value }));
              setMessage(null);
            }}
          />
        </article>

        <article className="panel admin-system-card">
          <div className="admin-system-copy">
            <Bell />
            <div>
              <h2>Avisos de logros</h2>
              <p>Controla los mensajes de logros en Discord sin quitar recompensas.</p>
            </div>
          </div>
          <Toggle
            checked={draft.achievementNotifications}
            disabled={saving}
            onChange={(value) => {
              setDraft((current) => ({ ...current, achievementNotifications: value }));
              setMessage(null);
            }}
          />
        </article>
      </section>

      <section className="panel admin-modules">
        <div className="panel-heading">
          <div>
            <span className="eyebrow"><Power size={14} /> Módulos del portal</span>
            <h2>Funciones disponibles</h2>
          </div>
          <div className="admin-module-actions">
            <button
              type="button"
              className="ghost-button"
              disabled={saving}
              onClick={() => {
                setDraft((current) => ({
                  ...current,
                  features: Object.fromEntries(
                    (Object.keys(featureMeta) as CommunityFeatureKey[]).map((key) => [key, true]),
                  ) as CommunitySettings["features"],
                }));
                setMessage(null);
              }}
            >
              Activar todas
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={saving}
              onClick={() => {
                setDraft((current) => ({
                  ...current,
                  features: Object.fromEntries(
                    (Object.keys(featureMeta) as CommunityFeatureKey[]).map((key) => [key, false]),
                  ) as CommunitySettings["features"],
                }));
                setMessage(null);
              }}
            >
              Desactivar todas
            </button>
          </div>
        </div>

        <div className="admin-feature-grid">
          {(Object.keys(featureMeta) as CommunityFeatureKey[]).map((feature) => {
            const meta = featureMeta[feature];
            const Icon = meta.icon;
            const enabled = draft.features[feature];
            const changed = draft.features[feature] !== saved.features[feature];
            return (
              <button
                key={feature}
                type="button"
                className={`admin-feature-card ${enabled ? "enabled" : ""} ${changed ? "dirty" : ""}`}
                disabled={saving}
                onClick={() => setFeature(feature, !enabled)}
              >
                <span className="admin-feature-icon"><Icon size={18} /></span>
                <strong>{meta.label}</strong>
                <p>{meta.description}</p>
                <em>{enabled ? "Activo" : "Desactivado"}{changed ? " · pendiente" : ""}</em>
              </button>
            );
          })}
        </div>
      </section>

      <div className={`admin-apply-bar ${dirty ? "visible" : ""}`}>
        <div>
          {dirty ? (
            <>
              <strong>Hay cambios sin aplicar</strong>
              <span>Guárdalos para que el menú, el acceso y Discord usen la nueva configuración.</span>
            </>
          ) : (
            <>
              <strong>Todo al día</strong>
              <span>No hay cambios pendientes.</span>
            </>
          )}
        </div>
        <div className="admin-apply-actions">
          <button type="button" className="ghost-button" disabled={!dirty || saving} onClick={discard}>
            <RotateCcw size={15} /> Descartar
          </button>
          <button
            type="button"
            className="admin-apply-button"
            disabled={!dirty || saving}
            onClick={applyChanges}
          >
            {saving ? <Power size={16} /> : dirty ? <Save size={16} /> : <Check size={16} />}
            {saving ? "Aplicando..." : "Aplicar cambios"}
          </button>
        </div>
      </div>

      {message && (
        <p className={`admin-feedback ${message.tone}`}>
          {message.tone === "ok" && <Check size={15} />}
          {message.text}
        </p>
      )}
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
