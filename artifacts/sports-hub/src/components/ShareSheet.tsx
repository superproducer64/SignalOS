import { useState, useRef, useEffect } from "react";
import { Share2, MessageSquare, Mail, X } from "lucide-react";
import { TeamCard } from "@workspace/api-client-react";

function buildShareText(team: TeamCard): string {
  const score = team.score;
  const highlight = team.highlights[0];
  const news = team.tradeNews[0];

  const lines: string[] = [
    `${team.city} ${team.name} [${team.league}]`,
    `Score: ${score.homeTeam} ${score.homeScore} — ${score.awayTeam} ${score.awayScore} (${score.status})`,
  ];
  if (highlight) lines.push(`Highlight: ${highlight.title}`);
  if (news) lines.push(`News: ${news.headline}`);

  return lines.join("\n");
}

function buildSmsUrl(text: string) {
  return `sms:?body=${encodeURIComponent(text)}`;
}

function buildTwitterUrl(text: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function buildEmailUrl(team: TeamCard, text: string) {
  const subject = `${team.city} ${team.name} Update`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
}

interface ShareSheetProps {
  team: TeamCard;
}

export function ShareSheet({ team }: ShareSheetProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = buildShareText(team);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${team.city} ${team.name}`,
          text,
        });
        return;
      } catch {
        // user cancelled or not supported — fall through to custom menu
      }
    }

    setOpen((v) => !v);
  };

  const close = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  };

  const text = buildShareText(team);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleShare}
        data-testid={`button-share-${team.id}`}
        className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Share ${team.name}`}
        type="button"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-50 min-w-[180px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Share</span>
            <button
              onClick={close}
              className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              type="button"
              aria-label="Close share menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={buildSmsUrl(text)}
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            data-testid={`link-share-sms-${team.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-foreground/90 no-underline"
          >
            <MessageSquare className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-sm font-semibold">Text Message</span>
          </a>

          <a
            href={buildTwitterUrl(text)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            data-testid={`link-share-twitter-${team.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-foreground/90 no-underline"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.749l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-sm font-semibold">Post on X</span>
          </a>

          <a
            href={buildEmailUrl(team, text)}
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            data-testid={`link-share-email-${team.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-foreground/90 no-underline border-t border-border/30"
          >
            <Mail className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-sm font-semibold">Email</span>
          </a>
        </div>
      )}
    </div>
  );
}
