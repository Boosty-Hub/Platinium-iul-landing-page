import { LeadOrigin } from "@/lib/leadOrigin";

export function OriginBadge({ origin, compact = false }: { origin: LeadOrigin; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${origin.badgeClass}`}
      title={origin.channel}
    >
      <span aria-hidden>{origin.icon}</span>
      <span className={compact ? "max-w-[120px] truncate" : ""}>{origin.channel}</span>
      {origin.isPaid && <span className="text-[10px] opacity-70">$</span>}
    </span>
  );
}
