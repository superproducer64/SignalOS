import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Trash2, Inbox } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Capture {
  signal_id: string;
  headline: string;
  summary: string;
  signal_score: number;
  reasons: string[];
  created_at: string;
}

interface Credibility {
  total: number;
  hits: number;
  misses: number;
  accuracy: number;
}

const FEED_THRESHOLD = 30;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CaptureCard({
  capture,
  inFeed,
  onDelete,
}: {
  capture: Capture;
  inFeed: boolean;
  onDelete: (signalId: string) => void;
}) {
  return (
    <article
      className={`rounded-xl overflow-hidden border ${
        inFeed ? "bg-card border-primary/40" : "bg-card/50 border-border/40"
      }`}
      data-testid={`capture-card-${capture.signal_id}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2.5">
          <p
            className={`flex-1 text-sm font-bold leading-snug ${
              inFeed ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {capture.headline}
          </p>
          <button
            type="button"
            onClick={() => onDelete(capture.signal_id)}
            data-testid={`button-delete-${capture.signal_id}`}
            aria-label="Delete capture"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-[11px] font-black tabular-nums px-1.5 py-0.5 rounded ${
              inFeed
                ? "text-primary bg-primary/10"
                : "text-muted-foreground bg-muted/30"
            }`}
          >
            {capture.signal_score} score
          </span>
          {capture.reasons.map((r) => (
            <span
              key={r}
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                inFeed
                  ? "text-primary border-primary/30 bg-primary/10"
                  : "text-muted-foreground border-border/50 bg-transparent"
              }`}
            >
              {r}
            </span>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {timeAgo(capture.created_at)}
          </span>
        </div>
      </div>
    </article>
  );
}

function CredibilityStat({ credibility }: { credibility: Credibility }) {
  if (credibility.total === 0) return null;

  const percent = Math.round(credibility.accuracy * 100);

  return (
    <div
      className="px-4 pt-4"
      data-testid="stat-signal-accuracy"
    >
      <div className="rounded-lg border border-border/40 bg-card/50 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Your signal accuracy:{" "}
          <span className="font-bold text-foreground">{percent}%</span>{" "}
          ({credibility.hits} of {credibility.total} captures matched your
          interests)
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
        <Inbox className="w-7 h-7 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        Nothing jotted down yet. Use the capture box on your dashboard to save
        thoughts on the fly.
      </p>
    </div>
  );
}

export default function Captures() {
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = ["/api/captures", userId ?? ""];

  const { data, isLoading } = useQuery<Capture[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/captures?userId=${encodeURIComponent(userId!)}`);
      if (!res.ok) throw new Error("Failed to fetch captures");
      return res.json() as Promise<Capture[]>;
    },
    enabled: !!userId,
  });

  const { data: credibility } = useQuery<Credibility>({
    queryKey: ["/api/user/credibility", userId ?? ""],
    queryFn: async () => {
      const res = await fetch(
        `/api/user/${encodeURIComponent(userId!)}/credibility`
      );
      if (!res.ok) throw new Error("Failed to fetch signal accuracy");
      return res.json() as Promise<Credibility>;
    },
    enabled: !!userId,
  });

  const captures = data ?? [];
  const inFeed = captures.filter((c) => c.signal_score > FEED_THRESHOLD);
  const filedAway = captures.filter((c) => c.signal_score <= FEED_THRESHOLD);

  async function handleDelete(signalId: string) {
    if (!userId) return;
    const previous = queryClient.getQueryData<Capture[]>(queryKey);
    queryClient.setQueryData<Capture[]>(queryKey, (old) =>
      (old ?? []).filter((c) => c.signal_id !== signalId)
    );
    try {
      const res = await fetch(
        `/api/captures/${signalId}?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete capture");
    } catch {
      queryClient.setQueryData(queryKey, previous);
      toast({ title: "Couldn't delete capture", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-10">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="flex items-center gap-2 max-w-md mx-auto px-4 pt-4 pb-3">
          <Link
            href="/"
            data-testid="link-back-home"
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-black tracking-tight leading-none">
            My Captures
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {isLoading ? (
          <div className="px-4 pt-4 flex flex-col gap-3">
            <Skeleton className="h-[90px] w-full rounded-xl" />
            <Skeleton className="h-[90px] w-full rounded-xl" />
            <Skeleton className="h-[90px] w-full rounded-xl" />
          </div>
        ) : captures.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {credibility && <CredibilityStat credibility={credibility} />}

            {inFeed.length > 0 && (
              <div className="px-4 pt-4">
                <div className="mb-3">
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                    In Your Feed
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {inFeed.map((c) => (
                    <CaptureCard
                      key={c.signal_id}
                      capture={c}
                      inFeed
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {filedAway.length > 0 && (
              <div className="px-4 pt-6">
                <div className="mb-3">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    Filed Away
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {filedAway.map((c) => (
                    <CaptureCard
                      key={c.signal_id}
                      capture={c}
                      inFeed={false}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
