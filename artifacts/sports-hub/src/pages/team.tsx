import { useGetTeam, getGetTeamQueryKey } from "@workspace/api-client-react";
import { TeamCardItem } from "@/components/TeamCardItem";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function Team() {
  const params = useParams();
  const teamId = params.id as string;
  const { data: team, isLoading } = useGetTeam(teamId, { query: { enabled: !!teamId, queryKey: getGetTeamQueryKey(teamId) } });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-8">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <Link
            href="/"
            data-testid="link-back"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-foreground text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-lg font-black tracking-tight uppercase line-clamp-1">{team ? team.name : "Team"}</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto">
        {isLoading ? (
          <Skeleton className="h-[600px] w-full rounded-xl bg-card border border-border" />
        ) : team ? (
          <TeamCardItem team={team} expanded={true} />
        ) : (
          <div className="text-center text-muted-foreground py-10" data-testid="text-not-found">Team not found</div>
        )}
      </main>
    </div>
  );
}
