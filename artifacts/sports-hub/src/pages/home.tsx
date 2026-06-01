import { useState } from "react";
import { useGetTeams } from "@workspace/api-client-react";
import { StoryCard, teamToStories, type Story } from "@/components/StoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Bookmark } from "lucide-react";
import { useSavedTeams } from "@/hooks/use-saved-teams";
import { Link } from "wouter";

/** Pick the first highlight story for a team, fall back to score */
function teamHeroStory(stories: Story[]): Story | null {
  return (
    stories.find((s) => s.type === "HIGHLIGHT") ??
    stories.find((s) => s.type === "SCORE") ??
    stories[0] ??
    null
  );
}

export default function Home() {
  const { data: teams, isLoading } = useGetTeams();
  const { isSaved } = useSavedTeams();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  // Build flat story feed — saved teams first, then unsaved
  const allStories: Story[] = [];
  if (teams) {
    const savedIds = new Set(teams.filter((t) => isSaved(t.id)).map((t) => t.id));
    const sorted = [
      ...teams.filter((t) => isSaved(t.id)),
      ...teams.filter((t) => !isSaved(t.id)),
    ];
    for (const team of sorted) {
      allStories.push(...teamToStories(team, savedIds));
    }
  }

  // Per-team highlight stories for the 3-block strip
  const teamHighlights: { teamId: string; primaryColor: string; secondaryColor: string; name: string; story: Story | null }[] =
    teams?.map((team) => {
      const stories = teamToStories(team, new Set());
      return {
        teamId: team.id,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        name: team.name,
        story: teamHeroStory(stories),
      };
    }) ?? [];

  // Filter by active team tab AND search query
  const filtered = allStories.filter((s) => {
    const matchesTeam = activeTeamId ? s.teamId === activeTeamId : true;
    if (!matchesTeam) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.teamName.toLowerCase().includes(q) ||
      s.teamCity.toLowerCase().includes(q) ||
      s.league.toLowerCase().includes(q) ||
      s.headline.toLowerCase().includes(q) ||
      s.player?.toLowerCase().includes(q)
    );
  });

  const activeTeam = teams?.find((t) => t.id === activeTeamId);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-10">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        {/* Title row */}
        <div className="flex items-center gap-2 max-w-md mx-auto px-4 pt-4 pb-2">
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground leading-none mb-0.5">
              My Dashboard
            </div>
            <h1 className="text-xl font-black tracking-tight leading-none">
              Sean's Dashboard
            </h1>
          </div>
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setQuery("");
            }}
            data-testid="button-toggle-search"
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={searchOpen ? "Close search" : "Open search"}
            type="button"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="max-w-md mx-auto px-4 pb-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                type="search"
                placeholder="Search stories, teams, players..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="input-search"
                className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Team tab shortcuts */}
        {!isLoading && teams && teams.length > 0 && (
          <div className="max-w-md mx-auto px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                data-testid="tab-all"
                onClick={() => setActiveTeamId(null)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary border ${
                  activeTeamId === null
                    ? "bg-foreground text-background border-transparent"
                    : "bg-transparent text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
                }`}
              >
                All
              </button>
              {teams.map((team) => {
                const isActive = activeTeamId === team.id;
                const saved = isSaved(team.id);
                return (
                  <button
                    key={team.id}
                    type="button"
                    data-testid={`tab-team-${team.id}`}
                    onClick={() =>
                      setActiveTeamId((prev) => (prev === team.id ? null : team.id))
                    }
                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary border"
                    style={
                      isActive
                        ? {
                            background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`,
                            color: "#fff",
                            borderColor: "transparent",
                          }
                        : {
                            background: `${team.primaryColor}18`,
                            color: team.primaryColor,
                            borderColor: `${team.primaryColor}40`,
                          }
                    }
                  >
                    {saved && (
                      <Bookmark
                        className="w-2.5 h-2.5 shrink-0"
                        style={{
                          fill: isActive ? "#fff" : team.primaryColor,
                          color: isActive ? "#fff" : team.primaryColor,
                        }}
                      />
                    )}
                    {team.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-md mx-auto">
        {/* ── 3-block horizontal team highlight strip ── */}
        {!query && !activeTeamId && (
          <div className="px-4 pt-4 pb-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Team Highlights
              </span>
              <div className="flex-1 h-px bg-border/30" />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-[140px] rounded-xl" />
                <Skeleton className="h-[140px] rounded-xl" />
                <Skeleton className="h-[140px] rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {teamHighlights.map(({ teamId, primaryColor, secondaryColor, name, story }) => (
                  <Link
                    key={teamId}
                    href={`/team/${teamId}`}
                    className="no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                    data-testid={`block-team-${teamId}`}
                  >
                    <div
                      className="relative overflow-hidden rounded-xl h-[140px] flex flex-col justify-end cursor-pointer transition-transform duration-150 active:scale-95 hover:opacity-90"
                      style={{
                        background: `linear-gradient(160deg, ${secondaryColor}cc 0%, ${primaryColor}ee 100%)`,
                      }}
                    >
                      {/* Diagonal stripe texture */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: `repeating-linear-gradient(
                            -45deg,
                            transparent,
                            transparent 6px,
                            rgba(255,255,255,0.5) 6px,
                            rgba(255,255,255,0.5) 7px
                          )`,
                        }}
                      />
                      {/* Team watermark */}
                      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none text-[42px] font-black uppercase tracking-tighter opacity-10 text-white leading-none px-1 text-center">
                        {name}
                      </div>
                      {/* Bottom gradient */}
                      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />

                      {/* Bookmark indicator */}
                      {isSaved(teamId) && (
                        <div className="absolute top-2 right-2">
                          <Bookmark className="w-3.5 h-3.5" style={{ fill: "#fff", color: "#fff" }} />
                        </div>
                      )}

                      {/* Content */}
                      <div className="relative z-10 p-2.5">
                        <div
                          className="text-[8px] font-black uppercase tracking-widest mb-0.5 opacity-90"
                          style={{ color: primaryColor === "#FFD700" || primaryColor === "#FFC72C" ? "#fff" : "#fff" }}
                        >
                          {name}
                        </div>
                        {story && (
                          <p className="text-white text-[10px] font-bold leading-tight line-clamp-3">
                            {story.headline}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Section label ── */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-black uppercase tracking-widest"
              style={activeTeam ? { color: activeTeam.primaryColor } : {}}
            >
              {activeTeam
                ? `${activeTeam.city} ${activeTeam.name}`
                : "Top Stories"}
            </span>
            <div
              className="flex-1 h-px"
              style={
                activeTeam
                  ? { background: `linear-gradient(to right, ${activeTeam.primaryColor}60, transparent)` }
                  : { background: "rgb(255 255 255 / 0.1)" }
              }
            />
            {activeTeam && (
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                {activeTeam.league}
              </span>
            )}
          </div>
        </div>

        {/* ── Story Feed ── */}
        <div className="px-4 pb-4 flex flex-col gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-[340px] w-full rounded-xl" />
              <Skeleton className="h-[180px] w-full rounded-xl" />
              <Skeleton className="h-[180px] w-full rounded-xl" />
            </>
          ) : filtered.length > 0 ? (
            filtered.map((story, i) => (
              <StoryCard
                key={story.id}
                story={story}
                hero={i === 0 && !query}
              />
            ))
          ) : (
            <div
              className="text-center text-muted-foreground py-16 text-sm"
              data-testid="text-no-results"
            >
              {query
                ? `No stories match "${query}"`
                : "No stories for this team yet."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
