import { ArrowUpRight, Award, Check, Clock3, AlertTriangle } from "lucide-react";

export function BestSellerBadge() {
  return <span className="badge best-seller-badge" title="Manually awarded in the demo control room based on completed demo sales"><Award size={13} />Best Seller</span>;
}

export function ConfidenceBadge({ score, compact = false }: { score: number; compact?: boolean }) {
  return <span className={`badge ${score >= 85 ? "badge-green" : "badge-amber"}`}>
    {score >= 85 ? <span className="status-dot" /> : <AlertTriangle size={12} />}
    {compact ? `${score}% confidence` : score >= 85 ? `Stock verified · ${score}%` : `Limited stock data · ${score}%`}
  </span>;
}

export function StatusBadge({ status }: { status: string }) {
  const good = ["accepted", "delivered", "completed", "closed"].includes(status);
  return <span className={`badge ${good ? "badge-green" : status === "cancelled" ? "badge-red" : "badge-amber"}`}>{good ? <Check size={12} /> : <Clock3 size={12} />}{status.replaceAll("_", " ")}</span>;
}

export function SectionHeading({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action && <button className="text-button" onClick={onAction}>{action}<ArrowUpRight size={15} /></button>}</div>;
}

export function relativeTime(value: string) {
  const minutes = Math.floor(Math.max(0, Date.now() - new Date(value).getTime()) / 60000);
  return minutes < 1 ? "Just now" : minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)}h ago`;
}
