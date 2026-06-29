import { Router, Request } from "express";
import { calculateSignalScore, UserPrefs } from "../lib/signal-score";

const router = Router();

const teams = [
  {
    id: "steelers",
    name: "Steelers",
    city: "Pittsburgh",
    league: "NFL",
    sport: "Football",
    primaryColor: "#FFB612",
    secondaryColor: "#101820",
    imageUrl: "https://picsum.photos/seed/steelers-stadium/800/500",
    score: {
      homeTeam: "Pittsburgh Steelers",
      awayTeam: "Baltimore Ravens",
      homeScore: 24,
      awayScore: 17,
      status: "FINAL",
      gameDate: "Sun, Jun 1",
      quarter: null,
      timeRemaining: null,
    },
    highlights: [
      {
        title: "Pickett Launches 52-Yard Bomb",
        description:
          "Kenny Pickett found George Pickens in stride down the sideline for a go-ahead touchdown in the fourth quarter, silencing the crowd in Baltimore.",
        player: "Kenny Pickett",
        timestamp: "Q4 2:14",
        imageUrl: "https://picsum.photos/seed/football-pass/800/500",
      },
      {
        title: "T.J. Watt Forced Fumble",
        description:
          "Watt stripped Lamar Jackson on a scramble and Cam Heyward recovered at the Baltimore 31-yard line, setting up the Steelers' go-ahead drive.",
        player: "T.J. Watt",
        timestamp: "Q3 8:55",
        imageUrl: "https://picsum.photos/seed/football-tackle/800/500",
      },
    ],
    tradeNews: [
      {
        headline: "Steelers Extend Watt Through 2026",
        summary:
          "Pittsburgh locked up star pass rusher T.J. Watt on a two-year extension worth $56 million, keeping him off the open market.",
        player: "T.J. Watt",
        date: "May 28, 2026",
        type: "SIGNING",
        imageUrl: "https://picsum.photos/seed/nfl-signing/800/500",
      },
      {
        headline: "WR Pickens Trade Rumors Emerge",
        summary:
          "Multiple teams have reportedly inquired about George Pickens availability ahead of training camp, but the Steelers maintain he is not available.",
        player: "George Pickens",
        date: "May 25, 2026",
        type: "TRADE",
        imageUrl: "https://picsum.photos/seed/nfl-trade/800/500",
      },
      {
        headline: "Najee Harris Released",
        summary:
          "The Steelers released running back Najee Harris as part of an offseason salary cap restructure, saving $5.1M.",
        player: "Najee Harris",
        date: "May 20, 2026",
        type: "RELEASE",
        imageUrl: "https://picsum.photos/seed/nfl-release/800/500",
      },
    ],
  },
  {
    id: "rockets",
    name: "Rockets",
    city: "Houston",
    league: "NBA",
    sport: "Basketball",
    primaryColor: "#CE1141",
    secondaryColor: "#C4CED4",
    imageUrl: "https://picsum.photos/seed/rockets-arena/800/500",
    score: {
      homeTeam: "Houston Rockets",
      awayTeam: "Golden State Warriors",
      homeScore: 108,
      awayScore: 104,
      status: "FINAL",
      gameDate: "Sat, May 31",
      quarter: null,
      timeRemaining: null,
    },
    highlights: [
      {
        title: "Green's Clutch Three Seals It",
        description:
          "Jalen Green drained a contested three-pointer with 18 seconds left to put Houston up four and effectively close out Golden State in a wild fourth quarter.",
        player: "Jalen Green",
        timestamp: "Q4 0:18",
        imageUrl: "https://picsum.photos/seed/basketball-shot/800/500",
      },
      {
        title: "Sengun Dominant in the Paint",
        description:
          "Alperen Sengun posted 26 points and 12 rebounds, bullying the Warriors frontcourt all night and converting a crucial and-one in the third.",
        player: "Alperen Sengun",
        timestamp: "Q3 5:33",
        imageUrl: "https://picsum.photos/seed/basketball-paint/800/500",
      },
    ],
    tradeNews: [
      {
        headline: "Rockets Acquire Veteran PG Bradley",
        summary:
          "Houston sent two second-round picks to Memphis for point guard Tony Bradley, addressing their need for experienced backcourt depth heading into the playoffs.",
        player: "Tony Bradley",
        date: "May 29, 2026",
        type: "TRADE",
        imageUrl: "https://picsum.photos/seed/nba-trade/800/500",
      },
      {
        headline: "Ime Udoka Signs Extension",
        summary:
          "Coach Ime Udoka agreed to a three-year contract extension, committing his future to the young Rockets core through 2029.",
        player: "Ime Udoka",
        date: "May 22, 2026",
        type: "SIGNING",
        imageUrl: "https://picsum.photos/seed/nba-coach/800/500",
      },
      {
        headline: "Green Exits with Ankle Sprain",
        summary:
          "Jalen Green rolled his ankle late in the third quarter but returned for the decisive fourth. MRI results are expected Monday.",
        player: "Jalen Green",
        date: "May 31, 2026",
        type: "INJURY",
        imageUrl: "https://picsum.photos/seed/nba-injury/800/500",
      },
    ],
  },
  {
    id: "astros",
    name: "Astros",
    city: "Houston",
    league: "MLB",
    sport: "Baseball",
    primaryColor: "#002D62",
    secondaryColor: "#EB6E1F",
    imageUrl: "https://picsum.photos/seed/astros-field/800/500",
    score: {
      homeTeam: "Houston Astros",
      awayTeam: "Texas Rangers",
      homeScore: 6,
      awayScore: 3,
      status: "FINAL",
      gameDate: "Sun, Jun 1",
      quarter: null,
      timeRemaining: null,
    },
    highlights: [
      {
        title: "Altuve Grand Slam in the 5th",
        description:
          "Jose Altuve cleared the bases with a no-doubt grand slam to left-center, turning a one-run deficit into a three-run lead against the Rangers' bullpen.",
        player: "Jose Altuve",
        timestamp: "5th inning",
        imageUrl: "https://picsum.photos/seed/baseball-homer/800/500",
      },
      {
        title: "Valdez Cruises Through 7 Innings",
        description:
          "Framber Valdez held Texas to two runs on five hits across seven dominant innings, striking out nine and walking just one.",
        player: "Framber Valdez",
        timestamp: "7 IP",
        imageUrl: "https://picsum.photos/seed/baseball-pitcher/800/500",
      },
    ],
    tradeNews: [
      {
        headline: "Astros Sign OF Hunter Renfroe",
        summary:
          "Houston inked veteran outfielder Hunter Renfroe to a one-year deal to add right-handed power off the bench.",
        player: "Hunter Renfroe",
        date: "May 30, 2026",
        type: "SIGNING",
        imageUrl: "https://picsum.photos/seed/mlb-signing/800/500",
      },
      {
        headline: "Verlander on 15-Day IL",
        summary:
          "Justin Verlander was placed on the 15-day injured list with right forearm tightness. The team is optimistic it is precautionary.",
        player: "Justin Verlander",
        date: "May 27, 2026",
        type: "INJURY",
        imageUrl: "https://picsum.photos/seed/mlb-injury/800/500",
      },
      {
        headline: "Astros Reportedly Pursuing SP Depth",
        summary:
          "Houston is scouting several available starters as insurance with Verlander sidelined, including names on the waiver wire.",
        player: "Multiple",
        date: "May 26, 2026",
        type: "TRADE",
        imageUrl: "https://picsum.photos/seed/mlb-trade/800/500",
      },
    ],
  },
];

/** Parse UserPrefs from query params. All params are optional. */
function parseUserPrefs(req: Request): UserPrefs {
  const csv = (val: unknown): string[] =>
    typeof val === "string" && val.trim()
      ? val.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  return {
    favoriteTeamIds: csv(req.query.favoriteTeams),
    likedCategories: csv(req.query.likedCategories),
    likedStoryIds: csv(req.query.likedStoryIds),
  };
}

/** Attach signalScore + reasons to every story object within a team. */
function scoreTeam(team: (typeof teams)[0], prefs: UserPrefs) {
  const base = { teamId: team.id };

  const scoredScore = {
    ...team.score,
    ...calculateSignalScore(
      { id: `${team.id}-score`, type: "SCORE", dateStr: team.score.gameDate, ...base },
      prefs
    ),
  };

  const scoredHighlights = team.highlights.map((hl, i) => ({
    ...hl,
    ...calculateSignalScore(
      { id: `${team.id}-hl-${i}`, type: "HIGHLIGHT", dateStr: hl.timestamp, ...base },
      prefs
    ),
  }));

  const scoredTradeNews = team.tradeNews.map((news, i) => ({
    ...news,
    ...calculateSignalScore(
      { id: `${team.id}-news-${i}`, type: news.type, dateStr: news.date, ...base },
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

router.get("/teams", (req, res) => {
  const prefs = parseUserPrefs(req);
  res.json(teams.map((t) => scoreTeam(t, prefs)));
});

router.get("/teams/:teamId", (req, res) => {
  const team = teams.find((t) => t.id === req.params.teamId);
  if (!team) {
    return res.status(404).json({ message: "Team not found" });
  }
  const prefs = parseUserPrefs(req);
  return res.json(scoreTeam(team, prefs));
});

export default router;
