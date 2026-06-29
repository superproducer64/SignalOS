/**
 * One-time seed script — inserts Sean + preferences + all mock stories into Supabase.
 * Run from repo root: node artifacts/api-server/scripts/seed.mjs
 *
 * Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function sbPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST /${path} failed ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`GET /${path} failed ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function sbDelete(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE /${path} failed ${res.status}: ${text}`);
  }
}

// ─── 1. Upsert Sean ──────────────────────────────────────────────────────────

console.log("1. Upserting Sean in users table...");

// Delete existing Sean if present (idempotent re-runs)
await sbDelete("users?email=eq.sean%40signalos.app");

const [sean] = await sbPost("users", {
  email: "sean@signalos.app",
});
const userId = sean.user_id;
console.log(`   → user_id: ${userId}`);

// ─── 2. Insert preferences ───────────────────────────────────────────────────

console.log("2. Inserting preferences...");

const prefs = [
  { user_id: userId, preference_type: "favorite_team", preference_value: "steelers", weight: 1 },
  { user_id: userId, preference_type: "favorite_team", preference_value: "rockets",  weight: 1 },
  { user_id: userId, preference_type: "favorite_team", preference_value: "astros",   weight: 1 },
  { user_id: userId, preference_type: "liked_category", preference_value: "trades",   weight: 1 },
  { user_id: userId, preference_type: "liked_category", preference_value: "injuries", weight: 1 },
];

await sbDelete(`preferences?user_id=eq.${userId}`);
const insertedPrefs = await sbPost("preferences", prefs);
console.log(`   → inserted ${insertedPrefs.length} preferences`);

// ─── 3. Build all signal rows ─────────────────────────────────────────────────

console.log("3. Building signal rows from mock data...");

const signals = [
  // ── Steelers ──────────────────────────────────────────────────────────────
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Pittsburgh Steelers 24, Baltimore Ravens 17",
    summary: "FINAL · Sun, Jun 1",
    category: "SCORE",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "steelers-score",
      team_id: "steelers",
      sort_order: 0,
      player: null,
      date_str: "Sun, Jun 1",
      image_url: "https://picsum.photos/seed/steelers-stadium/800/500",
      homeTeam: "Pittsburgh Steelers",
      awayTeam: "Baltimore Ravens",
      homeScore: 24,
      awayScore: 17,
      status: "FINAL",
      gameDate: "Sun, Jun 1",
      quarter: null,
      timeRemaining: null,
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Pickett Launches 52-Yard Bomb",
    summary: "Kenny Pickett found George Pickens in stride down the sideline for a go-ahead touchdown in the fourth quarter, silencing the crowd in Baltimore.",
    category: "HIGHLIGHT",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "steelers-hl-0",
      team_id: "steelers",
      sort_order: 0,
      player: "Kenny Pickett",
      date_str: "Q4 2:14",
      image_url: "https://picsum.photos/seed/football-pass/800/500",
      timestamp: "Q4 2:14",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "T.J. Watt Forced Fumble",
    summary: "Watt stripped Lamar Jackson on a scramble and Cam Heyward recovered at the Baltimore 31-yard line, setting up the Steelers' go-ahead drive.",
    category: "HIGHLIGHT",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "steelers-hl-1",
      team_id: "steelers",
      sort_order: 1,
      player: "T.J. Watt",
      date_str: "Q3 8:55",
      image_url: "https://picsum.photos/seed/football-tackle/800/500",
      timestamp: "Q3 8:55",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Steelers Extend Watt Through 2026",
    summary: "Pittsburgh locked up star pass rusher T.J. Watt on a two-year extension worth $56 million, keeping him off the open market.",
    category: "SIGNING",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "steelers-news-0",
      team_id: "steelers",
      sort_order: 0,
      player: "T.J. Watt",
      date_str: "May 28, 2026",
      image_url: "https://picsum.photos/seed/nfl-signing/800/500",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "WR Pickens Trade Rumors Emerge",
    summary: "Multiple teams have reportedly inquired about George Pickens availability ahead of training camp, but the Steelers maintain he is not available.",
    category: "TRADE",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "steelers-news-1",
      team_id: "steelers",
      sort_order: 1,
      player: "George Pickens",
      date_str: "May 25, 2026",
      image_url: "https://picsum.photos/seed/nfl-trade/800/500",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Najee Harris Released",
    summary: "The Steelers released running back Najee Harris as part of an offseason salary cap restructure, saving $5.1M.",
    category: "RELEASE",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "steelers-news-2",
      team_id: "steelers",
      sort_order: 2,
      player: "Najee Harris",
      date_str: "May 20, 2026",
      image_url: "https://picsum.photos/seed/nfl-release/800/500",
    },
  },

  // ── Rockets ───────────────────────────────────────────────────────────────
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Houston Rockets 108, Golden State Warriors 104",
    summary: "FINAL · Sat, May 31",
    category: "SCORE",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "rockets-score",
      team_id: "rockets",
      sort_order: 0,
      player: null,
      date_str: "Sat, May 31",
      image_url: "https://picsum.photos/seed/rockets-arena/800/500",
      homeTeam: "Houston Rockets",
      awayTeam: "Golden State Warriors",
      homeScore: 108,
      awayScore: 104,
      status: "FINAL",
      gameDate: "Sat, May 31",
      quarter: null,
      timeRemaining: null,
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Green's Clutch Three Seals It",
    summary: "Jalen Green drained a contested three-pointer with 18 seconds left to put Houston up four and effectively close out Golden State in a wild fourth quarter.",
    category: "HIGHLIGHT",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "rockets-hl-0",
      team_id: "rockets",
      sort_order: 0,
      player: "Jalen Green",
      date_str: "Q4 0:18",
      image_url: "https://picsum.photos/seed/basketball-shot/800/500",
      timestamp: "Q4 0:18",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Sengun Dominant in the Paint",
    summary: "Alperen Sengun posted 26 points and 12 rebounds, bullying the Warriors frontcourt all night and converting a crucial and-one in the third.",
    category: "HIGHLIGHT",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "rockets-hl-1",
      team_id: "rockets",
      sort_order: 1,
      player: "Alperen Sengun",
      date_str: "Q3 5:33",
      image_url: "https://picsum.photos/seed/basketball-paint/800/500",
      timestamp: "Q3 5:33",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Rockets Acquire Veteran PG Bradley",
    summary: "Houston sent two second-round picks to Memphis for point guard Tony Bradley, addressing their need for experienced backcourt depth heading into the playoffs.",
    category: "TRADE",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "rockets-news-0",
      team_id: "rockets",
      sort_order: 0,
      player: "Tony Bradley",
      date_str: "May 29, 2026",
      image_url: "https://picsum.photos/seed/nba-trade/800/500",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Ime Udoka Signs Extension",
    summary: "Coach Ime Udoka agreed to a three-year contract extension, committing his future to the young Rockets core through 2029.",
    category: "SIGNING",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "rockets-news-1",
      team_id: "rockets",
      sort_order: 1,
      player: "Ime Udoka",
      date_str: "May 22, 2026",
      image_url: "https://picsum.photos/seed/nba-coach/800/500",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Green Exits with Ankle Sprain",
    summary: "Jalen Green rolled his ankle late in the third quarter but returned for the decisive fourth. MRI results are expected Monday.",
    category: "INJURY",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "rockets-news-2",
      team_id: "rockets",
      sort_order: 2,
      player: "Jalen Green",
      date_str: "May 31, 2026",
      image_url: "https://picsum.photos/seed/nba-injury/800/500",
    },
  },

  // ── Astros ────────────────────────────────────────────────────────────────
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Houston Astros 6, Texas Rangers 3",
    summary: "FINAL · Sun, Jun 1",
    category: "SCORE",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "astros-score",
      team_id: "astros",
      sort_order: 0,
      player: null,
      date_str: "Sun, Jun 1",
      image_url: "https://picsum.photos/seed/astros-field/800/500",
      homeTeam: "Houston Astros",
      awayTeam: "Texas Rangers",
      homeScore: 6,
      awayScore: 3,
      status: "FINAL",
      gameDate: "Sun, Jun 1",
      quarter: null,
      timeRemaining: null,
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Altuve Grand Slam in the 5th",
    summary: "Jose Altuve cleared the bases with a no-doubt grand slam to left-center, turning a one-run deficit into a three-run lead against the Rangers' bullpen.",
    category: "HIGHLIGHT",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "astros-hl-0",
      team_id: "astros",
      sort_order: 0,
      player: "Jose Altuve",
      date_str: "5th inning",
      image_url: "https://picsum.photos/seed/baseball-homer/800/500",
      timestamp: "5th inning",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Valdez Cruises Through 7 Innings",
    summary: "Framber Valdez held Texas to two runs on five hits across seven dominant innings, striking out nine and walking just one.",
    category: "HIGHLIGHT",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "astros-hl-1",
      team_id: "astros",
      sort_order: 1,
      player: "Framber Valdez",
      date_str: "7 IP",
      image_url: "https://picsum.photos/seed/baseball-pitcher/800/500",
      timestamp: "7 IP",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Astros Sign OF Hunter Renfroe",
    summary: "Houston inked veteran outfielder Hunter Renfroe to a one-year deal to add right-handed power off the bench.",
    category: "SIGNING",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "astros-news-0",
      team_id: "astros",
      sort_order: 0,
      player: "Hunter Renfroe",
      date_str: "May 30, 2026",
      image_url: "https://picsum.photos/seed/mlb-signing/800/500",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Verlander on 15-Day IL",
    summary: "Justin Verlander was placed on the 15-day injured list with right forearm tightness. The team is optimistic it is precautionary.",
    category: "INJURY",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "astros-news-1",
      team_id: "astros",
      sort_order: 1,
      player: "Justin Verlander",
      date_str: "May 27, 2026",
      image_url: "https://picsum.photos/seed/mlb-injury/800/500",
    },
  },
  {
    user_id: userId,
    source_domain: "sports",
    headline: "Astros Reportedly Pursuing SP Depth",
    summary: "Houston is scouting several available starters as insurance with Verlander sidelined, including names on the waiver wire.",
    category: "TRADE",
    signal_score: 0,
    reasons: [],
    raw_data: {
      story_id: "astros-news-2",
      team_id: "astros",
      sort_order: 2,
      player: "Multiple",
      date_str: "May 26, 2026",
      image_url: "https://picsum.photos/seed/mlb-trade/800/500",
    },
  },
];

// ─── 4. Insert signals ────────────────────────────────────────────────────────

console.log("4. Inserting signals...");
await sbDelete(`signals?user_id=eq.${userId}`);
const insertedSignals = await sbPost("signals", signals);
console.log(`   → inserted ${insertedSignals.length} signals`);

console.log("\n✅ Seed complete!");
console.log(`   User:       sean@signalos.app (${userId})`);
console.log(`   Preferences: ${insertedPrefs.length} rows`);
console.log(`   Signals:    ${insertedSignals.length} rows`);
