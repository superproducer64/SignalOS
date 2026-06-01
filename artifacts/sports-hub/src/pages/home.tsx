import { useState } from "react";
import { useGetTeams } from "@workspace/api-client-react";
import { StoryCard, teamToStories, type Story } from "@/components/StoryCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Search, X, Bookmark } from "lucide-react";
import { useSavedTeams } from "@/hooks/use-saved-teams";

export default function Home() {
  const { data: teams, isLoading } = useGetTeams();
  const { isSaved } = useSavedTeams();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Build flat story feed sorted by: saved teams first, then unsaved
  const allStories: Story[] = [];
  if (teams) {
    const savedIds = new Set(teams.filter((t) => isSaved(t.id)).map((t) => t.id));

    // Saved teams first, then unsaved — preserving natural order within each group
    const sorted = [
      ...teams.filter((t) => isSaved(t.id)),
      ...teams.filter((t) => !isSaved(t.id)),
    ];

    for (const team of sorted) {
      allStories.push(...teamToStories(team, savedIds));
    }
  }

  const filtered = allStories.filter((s) => {
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

  const savedTeams = teams?.filter((t) => isSaved(t.id)) ?? [];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-10">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 px-4 shadow-sm">
        <div className="flex items-center gap-2 max-w-md mx-auto py-4">
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
          <div className="max-w-md mx-auto pb-3 animate-in fade-in slide-in-from-top-1 duration-150">
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
      </header>

      <main className="max-w-md mx-auto">
        {/* My Teams — horizontal strip (shown when teams are saved) */}
        {savedTeams.length > 0 && !query && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-1.5 mb-3">
              <Bookmark className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                My Teams
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {savedTeams.map((team) => (
                <Link
                  key={team.id}
                  href={`/team/${team.id}`}
                  className="no-underline shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
                  data-testid={`link-fav-team-${team.id}`}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-wide transition-opacity hover:opacity-80 active:opacity-70"
                    style={{
                      background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: "rgba(255,255,255,0.7)" }}
                    />
                    {team.name}
                    <span className="text-[9px] font-medium opacity-75">{team.league}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Divider label */}
        {!query && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                {savedTeams.length > 0 ? "Top Stories" : "Stories"}
              </span>
              <div className="flex-1 h-px bg-border/40" />
            </div>
          </div>
        )}

        {/* Story Feed */}
        <div className="px-4 pb-4 flex flex-col gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-[340px] w-full rounded-xl" />
              <Skeleton className="h-[180px] w-full rounded-xl" />
              <Skeleton className="h-[180px] w-full rounded-xl" />
              <Skeleton className="h-[180px] w-full rounded-xl" />
            </>
          ) : filtered.length > 0 ? (
            filtered.map((story, i) => (
              <StoryCard key={story.id} story={story} hero={i === 0 && !query} />
            ))
          ) : (
            <div
              className="text-center text-muted-foreground py-16 text-sm"
              data-testid="text-no-results"
            >
              No stories match &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
