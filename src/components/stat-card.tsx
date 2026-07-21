import type { LucideIcon } from "lucide-react";

type Props = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent?: "violet" | "cyan" | "rose" | "amber";
};

export function StatCard({ label, value, detail, icon: Icon, accent = "violet" }: Props) {
  return (
    <article className={`stat-card accent-${accent}`}>
      <div className="stat-icon"><Icon size={20} /></div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}
