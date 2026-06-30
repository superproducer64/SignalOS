import { Router, Request } from "express";
import { calculateSignalScore, UserPrefs } from "../lib/signal-score";
import { supabase } from "../lib/supabase";

const router = Router();

// ── Static team metadata (colors, branding — not stored in DB) ───────────────

const TEAM_META = {
  steelers: {
    id: "steelers",
    name: "Steelers",
    city: "Pittsburgh",
    league: "NFL",
    sport: "Football",
    primaryColor: "#FFB612",
    secondaryColor: "#101820",
    imageUrl: "https://picsum.photos/seed/steelers-stadium/800/500",
  },
  rockets: {
    id: "rockets",
    name: "Rockets",
    city: "Houston",
    league: "NBA",
    sport: "Basketball",
    primaryColor: "#CE1141",
    secondaryColor: "#C4CED4",
    imageUrl: "https://picsum.photos/seed/rockets-arena/800/500",
  },
  astros: {
    id: "astros",
    name: "Astros",
    city: "Houston",
    league: "MLB",
    sport: "Baseball",
    primaryColor: "#002D62",
    secondaryColor: "#EB6E1F",
    imageUrl: "https://picsum.photos/seed/astros-field/800/500",
  },
} as const;

type TeamId = keyof typeof TEAM_META;

// ── Supabase signal row type ──────────────────────────────────────────────────

type RawData = Record<string, unknown>;

type SignalRow = {
  signal_id: string;
  user_id: string;
  source_domain: string;
  headline: string;
  summary: string;
  category: string;
  raw_data: RawData;
  signal_score: number;
  reasons: string[];
  created_at: string;
};

// ── Fetch all sports signals from Supabase and reconstruct team objects ────────

async function fetchAllTeams() {
  const { data: signals, error } = await supabase
    .from("signals")
    .select("*")
    .eq("source_domain", "sports")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Supabase error: ${error.message}`);

  // Group by team_id stored inside raw_data
  const byTeam: Record<string, SignalRow[]> = {};
  for (const sig of signals as SignalRow[]) {
    const teamId = sig.raw_data?.team_id as string | undefined;
    if (!teamId) continue;
    (byTeam[teamId] ??= []).push(sig);
  }

  return (Object.keys(TEAM_META) as TeamId[]).map((teamId) => {
    const meta = TEAM_META[teamId];
    const teamSigs = (byTeam[teamId] ?? []).sort(
      (a, b) =>
        ((a.raw_data.sort_order as number) ?? 0) -
        ((b.raw_data.sort_order as number) ?? 0)
    );

    const scoreSig = teamSigs.find((s) => s.category === "SCORE");
    const hlSigs = teamSigs.filter((s) => s.category === "HIGHLIGHT");
    const newsSigs = teamSigs.filter((s) =>
      ["TRADE", "SIGNING", "RELEASE", "INJURY"].includes(s.category)
    );

    const rd = (sig: SignalRow) => sig.raw_data;

    const score = scoreSig
      ? {
          homeTeam: rd(scoreSig).homeTeam as string,
          awayTeam: rd(scoreSig).awayTeam as string,
          homeScore: rd(scoreSig).homeScore as number,
          awayScore: rd(scoreSig).awayScore as number,
          status: rd(scoreSig).status as string,
          gameDate: rd(scoreSig).gameDate as string,
          quarter: (rd(scoreSig).quarter as string | null) ?? null,
          timeRemaining: (rd(scoreSig).timeRemaining as string | null) ?? null,
        }
      : {
          homeTeam: "",
          awayTeam: "",
          homeScore: 0,
          awayScore: 0,
          status: "TBD",
          gameDate: "",
          quarter: null,
          timeRemaining: null,
        };

    const highlights = hlSigs.map((s) => ({
      title: s.headline,
      description: s.summary,
      player: (rd(s).player as string) ?? "",
      timestamp: rd(s).date_str as string,
      imageUrl: (rd(s).image_url as string) ?? null,
    }));

    const tradeNews = newsSigs.map((s) => ({
      headline: s.headline,
      summary: s.summary,
      player: (rd(s).player as string) ?? "Unknown",
      date: rd(s).date_str as string,
      type: s.category,
      imageUrl: (rd(s).image_url as string) ?? null,
    }));

    return { ...meta, score, highlights, tradeNews };
  });
}

// ── Parse UserPrefs from query params ─────────────────────────────────────────

function parseUserPrefs(req: Request): UserPrefs {
  const csv = (val: unknown): string[] =>
    typeof val === "string" && val.trim()
      ? val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const favoriteTeamIds = csv(req.query.favoriteTeams);
  const likedCategories = csv(req.query.likedCategories);

  return {
    matchedPreferenceValues: [...favoriteTeamIds, ...likedCategories],
    likedCategories,
    likedSignalIds: csv(req.query.likedStoryIds),
  };
}

// ── Score a team's stories using calculateSignalScore ────────────────────────

function scoreTeam(
  team: Awaited<ReturnType<typeof fetchAllTeams>>[0],
  prefs: UserPrefs
) {
  const base = { entityKey: team.id };

  const scoredScore = {
    ...team.score,
    ...calculateSignalScore(
      {
        id: `${team.id}-score`,
        type: "SCORE",
        dateStr: team.score.gameDate,
        ...base,
      },
      prefs
    ),
  };

  const scoredHighlights = team.highlights.map((hl, i) => ({
    ...hl,
    ...calculateSignalScore(
      {
        id: `${team.id}-hl-${i}`,
        type: "HIGHLIGHT",
        dateStr: hl.timestamp,
        ...base,
      },
      prefs
    ),
  }));

  const scoredTradeNews = team.tradeNews.map((news, i) => ({
    ...news,
    ...calculateSignalScore(
      {
        id: `${team.id}-news-${i}`,
        type: news.type,
        dateStr: news.date,
        ...base,
      },
      prefs
    ),
  }));

  return {
    ...team,
    score: scoredScore,
    highlights: scoredHighlights,
    tradeNews: scoredTradeNews,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get("/teams", async (req, res) => {
  try {
    const prefs = parseUserPrefs(req);
    const teams = await fetchAllTeams();
    res.json(teams.map((t) => scoreTeam(t, prefs)));
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
});

router.get("/teams/:teamId", async (req, res) => {
  try {
    const teams = await fetchAllTeams();
    const team = teams.find((t) => t.id === req.params.teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    const prefs = parseUserPrefs(req);
    return res.json(scoreTeam(team, prefs));
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
});

export default router;
