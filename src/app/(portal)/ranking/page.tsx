import { Crown, Medal, MessageCircle, Mic2, Sparkles, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const members = [
  ["Luna", "198.500", "51", "28.410", "212 h"],
  ["Kai", "179.070", "48", "25.905", "188 h"],
  ["Nova", "159.640", "42", "18.729", "139 h"],
  ["Mika", "140.210", "39", "21.084", "122 h"],
  ["Dante", "120.780", "36", "16.482", "164 h"],
  ["Ari", "101.350", "33", "14.209", "98 h"],
  ["Nox", "81.920", "29", "11.864", "85 h"],
];

export default function RankingPage() {
  return (
    <>
      <PageHeader eyebrow="Comunidad" title="Ranking" description="Los miembros que están haciendo historia en EyedComun." action={<button className="ghost-button">Este mes</button>} />
      <section className="podium">
        <article className="podium-second"><Medal /><span>#2</span><div className="avatar avatar-fallback" /><h3>Kai</h3><strong>179K XP</strong></article>
        <article className="podium-first"><Crown /><span>#1</span><div className="avatar avatar-fallback" /><h3>Luna</h3><strong>198K XP</strong></article>
        <article className="podium-third"><Trophy /><span>#3</span><div className="avatar avatar-fallback" /><h3>Nova</h3><strong>159K XP</strong></article>
      </section>
      <section className="panel ranking-table">
        <div className="ranking-row ranking-head"><span>Posición</span><span>Miembro</span><span><Sparkles /> XP</span><span>Nivel</span><span><MessageCircle /> Mensajes</span><span><Mic2 /> Voz</span></div>
        {members.map(([name, xp, level, messages, voice], index) => (
          <div className={`ranking-row ${name === "Nova" ? "is-you" : ""}`} key={name}>
            <strong>#{index + 1}</strong>
            <span className="ranking-member"><i className="avatar avatar-fallback" />{name}{name === "Nova" && <small>Tú</small>}</span>
            <b>{xp}</b><span>{level}</span><span>{messages}</span><span>{voice}</span>
          </div>
        ))}
      </section>
    </>
  );
}
