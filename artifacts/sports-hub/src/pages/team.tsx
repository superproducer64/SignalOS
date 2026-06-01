import { useGetTeam } from "@workspace/api-client-react";
import { TeamCardItem } from "@/components/TeamCardItem";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export default function Team() {
  const params = useParams();
  const teamId = params.id as string;
  const { data: team, isLoading } = useGetTeam(teamId, { query: { enabled: !!teamId } });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-8">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <Link href="/" className="mr-2 p-1 hover:bg-white/10 rounded-full transition-colors text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" data-testid="link-back">
            <ChevronLeft className="w-5 h-5" />
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
