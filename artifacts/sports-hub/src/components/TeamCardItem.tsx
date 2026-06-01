import { TeamCard } from "@workspace/api-client-react";
import { ChevronRight, Clock, Newspaper, PlayCircle, Bookmark } from "lucide-react";
import { ShareSheet } from "@/components/ShareSheet";
import { useSavedTeams } from "@/hooks/use-saved-teams";

export function TeamCardItem({ team, expanded = false }: { team: TeamCard; expanded?: boolean }) {
  const primary = team.primaryColor || "#333";
  const { isSaved, toggle } = useSavedTeams();
  const saved = isSaved(team.id);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(team.id);
  };

  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl transition-all duration-300 relative group flex flex-col bg-card border border-border/50 hover:border-border"
      style={{ borderTop: `6px solid ${primary}` }}
      data-testid={`card-team-${team.id}`}
    >
      {/* Subtle Background Glow */}
      <div
        className="absolute top-0 right-0 w-48 h-48 opacity-15 pointer-events-none rounded-bl-full"
        style={{ background: `linear-gradient(to bottom left, ${primary}, transparent)` }}
      />

      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/40 bg-black/20">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {team.city} {team.league}
          </div>
          <h2
            className="text-3xl font-black uppercase tracking-tight leading-none mt-1"
            style={{ color: primary }}
          >
            {team.name}
          </h2>
        </div>

        <div className="flex items-center gap-1 z-10">
          {/* Save button */}
          <button
            onClick={handleSave}
            data-testid={`button-save-${team.id}`}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={saved ? `Unsave ${team.name}` : `Save ${team.name}`}
            type="button"
          >
            <Bookmark
              className="w-4 h-4 transition-colors"
              style={saved ? { fill: primary, color: primary } : { color: "hsl(var(--muted-foreground))" }}
            />
          </button>

          {/* Share button */}
          <ShareSheet team={team} />

          {!expanded && (
            <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1 ml-1" />
          )}
        </div>
      </div>

      {/* Scoreboard Section */}
      <div className="p-5 bg-gradient-to-b from-black/60 to-transparent relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent pointer-events-none" />

        <div className="flex justify-between items-center mb-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-sm border border-white/5">
            <Clock className="w-3 h-3 text-primary" />
            {team.score.status}
          </span>
          {(team.score.quarter || team.score.timeRemaining) && (
            <span className="text-xs font-bold tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-sm">
              {team.score.quarter} • {team.score.timeRemaining}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center flex-1">
            <span className="text-5xl font-score leading-none tracking-tight mb-1">{team.score.homeScore}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {team.score.homeTeam}
            </span>
          </div>
          <div className="px-4 text-muted-foreground/30 font-black text-2xl">-</div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-5xl font-score leading-none tracking-tight mb-1">{team.score.awayScore}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {team.score.awayTeam}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col gap-4 border-t border-border/40 bg-card/50">
        {expanded ? (
          <>
            {team.highlights.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h3 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 text-muted-foreground">
                  <PlayCircle className="w-3.5 h-3.5 text-primary" />
                  Highlights
                </h3>
                <div className="flex flex-col gap-2">
                  {team.highlights.map((hl, i) => (
                    <div
                      key={i}
                      className="bg-black/40 p-3 rounded-lg border border-border/50 hover:bg-black/60 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm leading-snug text-foreground/90">{hl.title}</span>
                        <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap ml-3 mt-0.5">
                          {hl.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{hl.description}</p>
                      <div className="mt-2 text-[10px] uppercase font-bold text-primary tracking-widest">
                        {hl.player}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {team.tradeNews.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-2">
                <h3 className="text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 text-muted-foreground">
                  <Newspaper className="w-3.5 h-3.5 text-primary" />
                  News & Transactions
                </h3>
                <div className="flex flex-col gap-2">
                  {team.tradeNews.map((news, i) => (
                    <div
                      key={i}
                      className="bg-black/40 p-3 rounded-lg border border-border/50 hover:bg-black/60 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-primary/20 text-primary uppercase tracking-widest">
                          {news.type}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground mt-0.5">{news.date}</span>
                      </div>
                      <div className="font-bold text-sm leading-snug text-foreground/90 mb-1">{news.headline}</div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{news.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-between gap-4">
            {team.highlights[0] && (
              <div className="flex-1 bg-black/20 p-2.5 rounded-md border border-white/5 group-hover:bg-black/40 transition-colors">
                <div className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1.5 flex items-center gap-1">
                  <PlayCircle className="w-3 h-3" /> Latest Play
                </div>
                <div className="text-[13px] font-medium leading-tight line-clamp-2 text-foreground/80">
                  {team.highlights[0].title}
                </div>
              </div>
            )}
            {team.tradeNews[0] && (
              <div className="flex-1 bg-black/20 p-2.5 rounded-md border border-white/5 group-hover:bg-black/40 transition-colors">
                <div className="text-[9px] font-bold uppercase tracking-widest text-primary mb-1.5 flex items-center gap-1">
                  <Newspaper className="w-3 h-3" /> News
                </div>
                <div className="text-[13px] font-medium leading-tight line-clamp-2 text-foreground/80">
                  {team.tradeNews[0].headline}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
