import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { SignalItem } from "@/hooks/use-signal-feed";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

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
  userId,
  onDismiss,
}: {
  signal: SignalItem;
  hero?: boolean;
  userId?: string;
  onDismiss?: (signalId: string) => void;
}) {
  const { toast } = useToast();
  const color = domainColor(signal.source_domain);
  const label = signal.userSubmitted ? "You" : domainLabel(signal.source_domain);
  const summary = cleanSummary(signal.summary);

  const [removing, setRemoving] = useState(false);
  const [dimmed, setDimmed] = useState(false);

  async function postAction(action: "dismissed" | "less_like_this") {
    if (!userId) return;
    try {
      await fetch("/api/signal-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          signalId: signal.signal_id,
          action,
          source_domain: signal.source_domain,
          category: signal.category,
        }),
      });
    } catch {
      // best-effort — UI already reflects the action locally
    }
  }

  function handleNotInterested() {
    setRemoving(true);
    postAction("dismissed");
    window.setTimeout(() => onDismiss?.(signal.signal_id), 200);
  }

  function handleLessLikeThis() {
    setDimmed(true);
    postAction("less_like_this");
    toast({ title: "Got it", description: "We'll show fewer signals like this." });
  }

  return (
    <article
      className={`bg-card border rounded-xl overflow-hidden transition-all duration-200 ${
        hero ? "shadow-lg" : ""
      } ${signal.userSubmitted ? "border-primary/40" : "border-border/60"} ${
        removing ? "opacity-0 scale-95" : dimmed ? "opacity-50" : "opacity-100"
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
          {signal.userSubmitted ? (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              You submitted this
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              {signal.category}
            </span>
          )}
          <div className="flex-1" />
          <span
            className="text-[11px] font-black tabular-nums"
            style={{ color }}
          >
            {signal.signal_score}
          </span>
          <span className="text-[10px] text-muted-foreground">score</span>
          {userId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Signal options"
                  data-testid={`button-signal-menu-${signal.signal_id}`}
                  className="p-0.5 -mr-1 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={handleNotInterested}
                  data-testid={`menu-not-interested-${signal.signal_id}`}
                  className="text-xs"
                >
                  Not Interested
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLessLikeThis}
                  data-testid={`menu-less-like-this-${signal.signal_id}`}
                  className="text-xs"
                >
                  Less Like This
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
