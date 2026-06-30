import type { SignalItem } from "@/hooks/use-signal-feed";

const DOMAIN_LABELS: Record<string, string> = {
  technology: "Tech",
  general: "News",
  finance: "Finance",
  health: "Health",
  lifestyle: "Lifestyle",
  family: "Family",
};

const DOMAIN_COLORS: Record<string, string> = {
  technology: "#6366f1",
  general: "#0ea5e9",
  finance: "#10b981",
  health: "#f43f5e",
  lifestyle: "#f59e0b",
  family: "#8b5cf6",
};

function domainLabel(domain: string) {
  return DOMAIN_LABELS[domain] ?? domain.charAt(0).toUpperCase() + domain.slice(1);
}

function domainColor(domain: string) {
  return DOMAIN_COLORS[domain] ?? "#6b7280";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Clean up HN-style summary to just the article URL or a short excerpt */
function cleanSummary(raw: string): string {
  if (!raw) return "";
  // Strip "Article URL: ...\nComments URL: ...\nPoints: ...\n# Comments: ..." pattern
  const lines = raw.split("\n").filter((l) => {
    const t = l.trim();
    return (
      t &&
      !t.startsWith("Article URL:") &&
      !t.startsWith("Comments URL:") &&
      !t.startsWith("Points:") &&
      !t.startsWith("# Comments:")
    );
  });
  return lines.join(" ").trim().slice(0, 240);
}

export function SignalCard({
  signal,
  hero = false,
}: {
  signal: SignalItem;
  hero?: boolean;
}) {
  const color = domainColor(signal.source_domain);
  const label = domainLabel(signal.source_domain);
  const summary = cleanSummary(signal.summary);

  return (
    <article
      className={`bg-card border border-border/60 rounded-xl overflow-hidden ${
        hero ? "shadow-lg" : ""
      }`}
      data-testid={`signal-card-${signal.signal_id}`}
    >
      <div className="p-4">
        {/* Domain + score row */}
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: `${color}20`, color }}
          >
            {label}
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            {signal.category}
          </span>
          <div className="flex-1" />
          <span
            className="text-[11px] font-black tabular-nums"
            style={{ color }}
          >
            {signal.signal_score}
          </span>
          <span className="text-[10px] text-muted-foreground">score</span>
        </div>

        {/* Headline */}
        <h2
          className={`font-black leading-snug tracking-tight mb-1.5 ${
            hero ? "text-base" : "text-sm"
          }`}
        >
          {signal.headline}
        </h2>

        {/* Summary */}
        {summary && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {summary}
          </p>
        )}

        {/* Reasons + timestamp */}
        <div className="flex flex-wrap items-center gap-1.5">
          {signal.reasons.map((r) => (
            <span
              key={r}
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
              style={{
                color,
                borderColor: `${color}40`,
                background: `${color}10`,
              }}
            >
              {r}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {timeAgo(signal.created_at)}
          </span>
        </div>
      </div>
    </article>
  );
}
