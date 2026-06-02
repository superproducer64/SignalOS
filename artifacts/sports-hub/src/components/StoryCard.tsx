import { Link } from "wouter";
import { Bookmark, Share2, MessageSquare, Mail, X as XIcon } from "lucide-react";
import { TeamCard } from "@workspace/api-client-react";
import { useSavedTeams } from "@/hooks/use-saved-teams";
import { useState, useRef, useEffect } from "react";

export type Story = {
  id: string;
  teamId: string;
  teamName: string;
  teamCity: string;
  league: string;
  sport: string;
  primaryColor: string;
  secondaryColor: string;
  teamImageUrl?: string | null;
  imageUrl?: string | null;
  type: "SCORE" | "HIGHLIGHT" | "TRADE" | "SIGNING" | "RELEASE" | "INJURY" | "NEWS";
  headline: string;
  summary: string;
  player?: string;
  timestamp: string;
};

function buildShareText(story: Story): string {
  return [
    `${story.teamCity} ${story.teamName} [${story.league}]`,
    story.headline,
    story.summary,
  ].join("\n");
}

const TYPE_LABELS: Record<Story["type"], string> = {
  SCORE: "FINAL SCORE",
  HIGHLIGHT: "HIGHLIGHT",
  TRADE: "TRADE",
  SIGNING: "SIGNING",
  RELEASE: "RELEASED",
  INJURY: "INJURY",
  NEWS: "NEWS",
};

const TYPE_COLORS: Record<Story["type"], string> = {
  SCORE: "bg-emerald-600",
  HIGHLIGHT: "bg-primary",
  TRADE: "bg-amber-600",
  SIGNING: "bg-blue-600",
  RELEASE: "bg-neutral-600",
  INJURY: "bg-red-600",
  NEWS: "bg-primary",
};

function ShareMenu({ story, onClose }: { story: Story; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const text = buildShareText(story);
  const sms = `sms:?body=${encodeURIComponent(text)}`;
  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  const email = `mailto:?subject=${encodeURIComponent(story.headline)}&body=${encodeURIComponent(text)}`;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-9 z-50 min-w-[180px] rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Share</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" type="button" aria-label="Close">
          <XIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      <a href={sms} onClick={onClose} data-testid={`link-share-sms-${story.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-foreground/90 no-underline">
        <MessageSquare className="w-4 h-4 text-green-400 shrink-0" />
        <span className="text-sm font-semibold">Text Message</span>
      </a>
      <a href={tw} target="_blank" rel="noopener noreferrer" onClick={onClose} data-testid={`link-share-tw-${story.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-foreground/90 no-underline">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.749l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="text-sm font-semibold">Post on X</span>
      </a>
      <a href={email} onClick={onClose} data-testid={`link-share-email-${story.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-foreground/90 no-underline border-t border-border/30">
        <Mail className="w-4 h-4 text-sky-400 shrink-0" />
        <span className="text-sm font-semibold">Email</span>
      </a>
    </div>
  );
}

interface StoryCardProps {
  story: Story;
  hero?: boolean;
}

export function StoryCard({ story, hero = false }: StoryCardProps) {
  const { isSaved, toggle } = useSavedTeams();
  const saved = isSaved(story.teamId);
  const [shareOpen, setShareOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const photoUrl = !imgError ? (story.imageUrl ?? story.teamImageUrl ?? null) : null;

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(story.teamId);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = buildShareText(story);
    if (navigator.share) {
      try {
        await navigator.share({ title: story.headline, text });
        return;
      } catch { /* fall through */ }
    }
    setShareOpen((v) => !v);
  };

  const typeLabel = TYPE_LABELS[story.type] ?? story.type;
  const typeBg = TYPE_COLORS[story.type] ?? "bg-primary";

  return (
    <Link
      href={`/team/${story.teamId}`}
      className="block no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      data-testid={`link-story-${story.id}`}
    >
      <article
        className={`relative overflow-hidden rounded-xl bg-card border border-border/40 shadow-lg transition-all duration-200 hover:border-border hover:shadow-xl active:scale-[0.99] ${hero ? "min-h-[340px]" : "min-h-[180px]"} flex flex-col`}
        data-testid={`card-story-${story.id}`}
      >
        {/* Hero image area */}
        <div
          className={`relative shrink-0 overflow-hidden ${hero ? "h-[220px]" : "h-[110px]"}`}
          style={
            !photoUrl
              ? {
                  background: `linear-gradient(135deg, ${story.secondaryColor}ee 0%, ${story.primaryColor}cc 50%, ${story.secondaryColor}99 100%)`,
                }
              : undefined
          }
        >
          {/* Real photo */}
          {photoUrl && (
            <img
              src={photoUrl}
              alt={story.headline}
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Gradient fallback texture (shown when no image) */}
          {!photoUrl && (
            <>
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    -45deg,
                    transparent,
                    transparent 8px,
                    rgba(255,255,255,0.4) 8px,
                    rgba(255,255,255,0.4) 9px
                  )`,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none text-[88px] font-black uppercase tracking-tighter opacity-10 text-white">
                {story.teamName}
              </div>
            </>
          )}

          {/* Bottom gradient over image for readability */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
          {/* Top vignette for action buttons */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />

          {/* Story type badge — bottom left */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className={`${typeBg} text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm`}>
              {typeLabel}
            </span>
            <span className="text-white/80 text-[10px] font-semibold uppercase tracking-wider bg-black/40 px-2 py-1 rounded-sm">
              {story.league}
            </span>
          </div>

          {/* Action buttons — top right */}
          <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
            <button
              onClick={handleSave}
              data-testid={`button-save-${story.id}`}
              type="button"
              aria-label={saved ? `Unsave ${story.teamName}` : `Save ${story.teamName}`}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary backdrop-blur-sm"
            >
              <Bookmark
                className="w-4 h-4 transition-colors"
                style={saved ? { fill: story.primaryColor, color: story.primaryColor } : { color: "white" }}
              />
            </button>

            <div className="relative">
              <button
                onClick={handleShare}
                data-testid={`button-share-${story.id}`}
                type="button"
                aria-label={`Share ${story.headline}`}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary backdrop-blur-sm"
              >
                <Share2 className="w-4 h-4 text-white" />
              </button>
              {shareOpen && (
                <ShareMenu story={story} onClose={() => setShareOpen(false)} />
              )}
            </div>
          </div>
        </div>

        {/* Text content */}
        <div className="p-4 flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: story.primaryColor }}
            >
              {story.teamCity} {story.teamName}
            </span>
            {story.player && (
              <>
                <span className="text-muted-foreground/40 text-[10px]">·</span>
                <span className="text-[10px] text-muted-foreground font-semibold">{story.player}</span>
              </>
            )}
          </div>

          <h2
            className={`font-black leading-tight text-foreground ${hero ? "text-[22px]" : "text-[15px]"}`}
          >
            {story.headline}
          </h2>

          {hero && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-1 line-clamp-3">
              {story.summary}
            </p>
          )}

          <div className="mt-auto pt-2 text-[11px] text-muted-foreground/60 font-medium">
            {story.timestamp}
          </div>
        </div>
      </article>
    </Link>
  );
}

/** Flatten a team's data into a list of Story objects */
export function teamToStories(team: TeamCard, _savedTeamIds: Set<string>): Story[] {
  const base = {
    teamId: team.id,
    teamName: team.name,
    teamCity: team.city,
    league: team.league,
    sport: team.sport,
    primaryColor: team.primaryColor,
    secondaryColor: team.secondaryColor,
    teamImageUrl: team.imageUrl ?? null,
  };

  const stories: Story[] = [];

  // Score story — use team hero image
  stories.push({
    ...base,
    id: `${team.id}-score`,
    type: "SCORE",
    headline: `${team.score.homeTeam} ${team.score.homeScore}, ${team.score.awayTeam} ${team.score.awayScore}`,
    summary: `${team.score.status} · ${team.score.gameDate}`,
    timestamp: team.score.gameDate,
    imageUrl: team.imageUrl ?? null,
  });

  // Highlights
  team.highlights.forEach((hl, i) => {
    stories.push({
      ...base,
      id: `${team.id}-hl-${i}`,
      type: "HIGHLIGHT",
      headline: hl.title,
      summary: hl.description,
      player: hl.player,
      timestamp: hl.timestamp,
      imageUrl: hl.imageUrl ?? team.imageUrl ?? null,
    });
  });

  // Trade news
  team.tradeNews.forEach((news, i) => {
    stories.push({
      ...base,
      id: `${team.id}-news-${i}`,
      type: news.type as Story["type"],
      headline: news.headline,
      summary: news.summary,
      player: news.player !== "Multiple" ? news.player : undefined,
      timestamp: news.date,
      imageUrl: news.imageUrl ?? team.imageUrl ?? null,
    });
  });

  return stories;
}
