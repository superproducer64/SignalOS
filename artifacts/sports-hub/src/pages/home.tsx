import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TeamCard } from "@workspace/api-client-react";
import { StoryCard, teamToStories, type Story } from "@/components/StoryCard";
import { SignalCard } from "@/components/SignalCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Bookmark, Zap } from "lucide-react";
import { useSavedTeams } from "@/hooks/use-saved-teams";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSignalFeed } from "@/hooks/use-signal-feed";
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

/** Single team highlight tile */
function TeamHighlightTile({
  team,
  story,
  saved,
}: {
  team: TeamCard;
  story: Story | null;
  saved: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const showPhoto = !!team.imageUrl && !imgError;

  return (
    <Link
      href={`/team/${team.id}`}
      className="no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      data-testid={`block-team-${team.id}`}
    >
      <div
        className="relative overflow-hidden rounded-xl h-[140px] flex flex-col justify-end cursor-pointer transition-transform duration-150 active:scale-95 hover:opacity-90"
        style={
          !showPhoto
            ? {
                background: `linear-gradient(160deg, ${team.secondaryColor}cc 0%, ${team.primaryColor}ee 100%)`,
              }
            : undefined
        }
      >
        {showPhoto && (
          <img
            src={team.imageUrl!}
            alt={team.name}
            onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        {saved && (
          <div className="absolute top-2 right-2 z-10">
            <Bookmark className="w-3.5 h-3.5" style={{ fill: "#fff", color: "#fff" }} />
          </div>
        )}
        <div className="relative z-10 p-2.5">
          <div className="text-[8px] font-black uppercase tracking-widest mb-0.5 text-white/80">
            {team.name}
          </div>
          {story && (
            <p className="text-white text-[10px] font-bold leading-tight line-clamp-3">
              {story.headline}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Empty state — only shown when user truly has no matching content */
function EmptySignalState({ name }: { name: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
        <Zap className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-lg font-black tracking-tight mb-2">
        {name
          ? `${name}'s signal is just getting started.`
          : "Your signal is just getting started."}
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        As we add sources for your interests, they'll show up here. Check back soon.
      </p>
    </div>
  );
}

/** Section heading divider */
function SectionLabel({
  label,
  color,
  sub,
}: {
  label: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[11px] font-black uppercase tracking-widest"
        style={color ? { color } : {}}
      >
        {label}
      </span>
      <div
        className="flex-1 h-px"
        style={
          color
            ? { background: `linear-gradient(to right, ${color}60, transparent)` }
            : { background: "rgb(255 255 255 / 0.1)" }
        }
      />
      {sub && (
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
          {sub}
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const { isSaved, savedIds } = useSavedTeams();

  const hasSports = user?.hasSportsInterest ?? false;
  const signalDomains = user?.signalDomains ?? [];

  // Sports data — only fetched when user has sports interest
  const favoriteTeamsParam = savedIds.length
    ? `?favoriteTeams=${savedIds.join(",")}`
    : "";
  const { data: teams, isLoading: teamsLoading } = useQuery<TeamCard[]>({
    queryKey: ["/api/teams", savedIds],
    queryFn: async () => {
      const res = await fetch(`/api/teams${favoriteTeamsParam}`);
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json() as Promise<TeamCard[]>;
    },
    enabled: hasSports,
  });

  // Generic signal feed — only fetched when user has non-sports domains
  const { signals, isLoading: signalsLoading } = useSignalFeed(
    userLoading ? [] : signalDomains
  );

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  // Sports story list
  const allStories: Story[] = [];
  if (teams) {
    const savedSet = new Set(teams.filter((t) => isSaved(t.id)).map((t) => t.id));
    const sorted = [
      ...teams.filter((t) => isSaved(t.id)),
      ...teams.filter((t) => !isSaved(t.id)),
    ];
    for (const team of sorted) {
      allStories.push(...teamToStories(team, savedSet));
    }
  }

  const teamHighlights = (teams ?? []).map((team) => {
    const stories = teamToStories(team, new Set());
    return { team, story: teamHeroStory(stories) };
  });

  const filteredStories = allStories.filter((s) => {
    const matchesTeam = activeTeamId ? s.teamId === activeTeamId : true;
    if (!matchesTeam) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.teamName.toLowerCase().includes(q) ||
      s.teamCity.toLowerCase().includes(q) ||
      s.league.toLowerCase().includes(q) ||
      s.headline.toLowerCase().includes(q) ||
      (s.player?.toLowerCase().includes(q) ?? false)
    );
  });

  const filteredSignals = signals.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.headline.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.source_domain.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  const activeTeam = teams?.find((t) => t.id === activeTeamId);

  const displayName = userLoading ? null : (user?.name ?? null);

  // Determine overall loading state
  const isLoading =
    userLoading ||
    (hasSports && teamsLoading) ||
    (signalDomains.length > 0 && signalsLoading);

  // True empty: user loaded, no sports, no signal domains, or domains loaded but 0 signals
  const hasNoContent =
    !userLoading &&
    !hasSports &&
    (signalDomains.length === 0 ||
      (!signalsLoading && signals.length === 0));

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-10">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="flex items-center gap-2 max-w-md mx-auto px-4 pt-4 pb-2">
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground leading-none mb-0.5">
              My Dashboard
            </div>
            {userLoading ? (
              <Skeleton className="h-6 w-40 mt-0.5" />
            ) : (
              <h1 className="text-xl font-black tracking-tight leading-none">
                {displayName ? `${displayName}'s Dashboard` : "My Dashboard"}
              </h1>
            )}
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

        {searchOpen && (
          <div className="max-w-md mx-auto px-4 pb-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                type="search"
                placeholder="Search stories, signals, topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="input-search"
                className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Sports team filter tabs */}
        {hasSports && !teamsLoading && teams && teams.length > 0 && (
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
                      setActiveTeamId((prev) =>
                        prev === team.id ? null : team.id
                      )
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
        {isLoading ? (
          /* Loading skeletons */
          <div className="px-4 pt-4 flex flex-col gap-4">
            {hasSports && (
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-[140px] rounded-xl" />
                <Skeleton className="h-[140px] rounded-xl" />
                <Skeleton className="h-[140px] rounded-xl" />
              </div>
            )}
            <Skeleton className="h-[180px] w-full rounded-xl" />
            <Skeleton className="h-[140px] w-full rounded-xl" />
            <Skeleton className="h-[140px] w-full rounded-xl" />
          </div>
        ) : hasNoContent ? (
          <EmptySignalState name={displayName} />
        ) : (
          <>
            {/* ── Sports section ── */}
            {hasSports && (
              <>
                {/* Team Highlights strip */}
                {!query && !activeTeamId && teamHighlights.length > 0 && (
                  <div className="px-4 pt-4 pb-1">
                    <div className="mb-3">
                      <SectionLabel label="Team Highlights" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {teamHighlights.map(({ team, story }) => (
                        <TeamHighlightTile
                          key={team.id}
                          team={team}
                          story={story}
                          saved={isSaved(team.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sports story feed */}
                <div className="px-4 pt-4 pb-2">
                  <SectionLabel
                    label={
                      activeTeam
                        ? `${activeTeam.city} ${activeTeam.name}`
                        : "Top Stories"
                    }
                    color={activeTeam?.primaryColor}
                    sub={activeTeam?.league}
                  />
                </div>
                <div className="px-4 pb-4 flex flex-col gap-4">
                  {filteredStories.length > 0 ? (
                    filteredStories.map((story, i) => (
                      <StoryCard
                        key={story.id}
                        story={story}
                        hero={i === 0 && !query}
                      />
                    ))
                  ) : (
                    <div
                      className="text-center text-muted-foreground py-8 text-sm"
                      data-testid="text-no-results"
                    >
                      {query
                        ? `No stories match "${query}"`
                        : "No stories for this team yet."}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Generic signal feed ── */}
            {signalDomains.length > 0 && (
              <>
                <div className="px-4 pt-4 pb-2">
                  <SectionLabel label="My Signal Feed" />
                </div>
                <div className="px-4 pb-6 flex flex-col gap-3">
                  {filteredSignals.length > 0 ? (
                    filteredSignals.map((signal, i) => (
                      <SignalCard
                        key={signal.signal_id}
                        signal={signal}
                        hero={i === 0 && !hasSports && !query}
                      />
                    ))
                  ) : (
                    <div
                      className="text-center text-muted-foreground py-8 text-sm"
                      data-testid="text-no-signals"
                    >
                      {query
                        ? `No signals match "${query}"`
                        : "No signals for your interests yet."}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
