import { useGetTeams } from "@workspace/api-client-react";
import { TeamCardItem } from "@/components/TeamCardItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Trophy } from "lucide-react";

export default function Home() {
  const { data: teams, isLoading } = useGetTeams();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-8">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 py-4 shadow-sm">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <Trophy className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-black tracking-tight uppercase">Sports Hub</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto flex flex-col gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-[400px] w-full rounded-xl bg-card border border-border" />
            <Skeleton className="h-[400px] w-full rounded-xl bg-card border border-border" />
            <Skeleton className="h-[400px] w-full rounded-xl bg-card border border-border" />
          </>
        ) : (
          teams?.map((team) => (
            <Link 
              key={team.id} 
              href={`/team/${team.id}`} 
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl no-underline"
              data-testid={`link-team-${team.id}`}
            >
              <TeamCardItem team={team} />
            </Link>
          ))
        )}
      </main>
    </div>
  );
}
