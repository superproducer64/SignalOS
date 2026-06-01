import { useState } from "react";
import { useGetTeams } from "@workspace/api-client-react";
import { TeamCardItem } from "@/components/TeamCardItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Trophy, Search, X } from "lucide-react";

export default function Home() {
  const { data: teams, isLoading } = useGetTeams();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const filtered = teams?.filter((team) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      team.name.toLowerCase().includes(q) ||
      team.city.toLowerCase().includes(q) ||
      team.league.toLowerCase().includes(q) ||
      team.sport.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-8">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 shadow-sm">
        {/* Title row */}
        <div className="flex items-center gap-2 max-w-md mx-auto py-4">
          <Trophy className="w-5 h-5 text-primary shrink-0" />
          <h1 className="text-xl font-black tracking-tight uppercase flex-1">Sports Hub</h1>
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setQuery("");
            }}
            data-testid="button-toggle-search"
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={searchOpen ? "Close search" : "Open search"}
            type="button"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {/* Search bar — slides in */}
        {searchOpen && (
          <div className="max-w-md mx-auto pb-3 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                autoFocus
                type="search"
                placeholder="Search teams, leagues..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="input-search"
                className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </header>

      <main className="px-4 py-6 max-w-md mx-auto flex flex-col gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-[400px] w-full rounded-xl bg-card border border-border" />
            <Skeleton className="h-[400px] w-full rounded-xl bg-card border border-border" />
            <Skeleton className="h-[400px] w-full rounded-xl bg-card border border-border" />
          </>
        ) : filtered && filtered.length > 0 ? (
          filtered.map((team) => (
            <Link
              key={team.id}
              href={`/team/${team.id}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl no-underline"
              data-testid={`link-team-${team.id}`}
            >
              <TeamCardItem team={team} />
            </Link>
          ))
        ) : (
          <div
            className="text-center text-muted-foreground py-16 text-sm"
            data-testid="text-no-results"
          >
            No teams match &ldquo;{query}&rdquo;
          </div>
        )}
      </main>
    </div>
  );
}
