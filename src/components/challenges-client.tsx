"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Gift, Target } from "lucide-react";
import type { Challenge } from "@/lib/types";

export function ChallengesClient({ challenges }: { challenges: Challenge[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function claim(id: string) {
    setBusy(id);
    setMessage("");
    try {
      const response = await fetch(`/api/community/challenges/${encodeURIComponent(id)}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo reclamar");
      setMessage(`Recompensa reclamada: +${body.reward.eyedCoins} EyedCoins.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo reclamar");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <section className="challenge-list">
        {challenges.map((challenge) => (
          <article className={`panel challenge-card ${challenge.completed ? "complete" : ""}`} key={challenge.id}>
            <div className="challenge-icon">{challenge.completed ? <Check /> : <Target />}</div>
            <div>
              <h3>{challenge.definition.title}</h3>
              <p>{challenge.definition.description}</p>
              <div className="progress-track">
                <span style={{ width: `${Math.min(100, challenge.progress / Math.max(1, challenge.definition.target) * 100)}%` }} />
              </div>
              <small>{challenge.progress.toLocaleString("es")} / {challenge.definition.target.toLocaleString("es")}</small>
            </div>
            {challenge.claimed ? <b>Reclamado</b> : challenge.completed ? (
              <button className="secondary-button" disabled={busy === challenge.id} onClick={() => claim(challenge.id)}>
                <Gift size={16} /> {busy === challenge.id ? "Reclamando…" : `+${challenge.reward.eyedCoins}`}
              </button>
            ) : <b>En progreso</b>}
          </article>
        ))}
      </section>
      {message && <p className="form-message">{message}</p>}
    </>
  );
}
