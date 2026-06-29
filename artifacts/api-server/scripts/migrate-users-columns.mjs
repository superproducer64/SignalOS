/**
 * Migration: add name/age_range/demographic_type columns to users table via
 * Supabase session pooler (port 5432), then migrate + clean preferences.
 *
 * Run from repo root:
 *   node artifacts/api-server/scripts/migrate-users-columns.mjs
 */

import pg from "/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js";
const { Client } = pg;

const SUPABASE_URL = process.env.SUPABASE_URL;
const DB_PASSWORD  = process.env.SUPABASE_DB_PASSWORD;

if (!SUPABASE_URL || !DB_PASSWORD) {
  console.error("Missing SUPABASE_URL or SUPABASE_DB_PASSWORD");
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");
const poolerUser = `postgres.${projectRef}`;

// Session-mode pooler (port 5432) is required for DDL
const REGIONS = [
  "us-east-1", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2",
  "ap-southeast-1", "ap-northeast-1",
];

async function tryConnect(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  const client = new Client({
    host,
    port: 5432,         // session pooler
    database: "postgres",
    user: poolerUser,
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 6000,
  });
  await client.connect();
  return client;
}

let client;
for (const region of REGIONS) {
  try {
    process.stdout.write(`Trying ${region}... `);
    client = await tryConnect(region);
    console.log("✓ connected!");
    break;
  } catch (err) {
    console.log(`✗ (${err.message.split("\n")[0]})`);
  }
}

if (!client) {
  console.error("\nCould not connect to any Supabase pooler region. Check SUPABASE_DB_PASSWORD.");
  process.exit(1);
}

// ── 1. Add columns ────────────────────────────────────────────────────────────
console.log("\n1. Adding columns to users table...");
await client.query(`
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS name             TEXT,
    ADD COLUMN IF NOT EXISTS age_range        TEXT,
    ADD COLUMN IF NOT EXISTS demographic_type TEXT;
`);
console.log("   ✓ name, age_range, demographic_type columns added (or already existed)");

// ── 2. Migrate existing preference rows → users columns ───────────────────────
console.log("\n2. Migrating demographic preference rows into users columns...");
const { rows: prefRows } = await client.query(`
  SELECT
    p.user_id,
    MAX(CASE WHEN p.preference_type = 'name'             THEN p.preference_value END) AS name,
    MAX(CASE WHEN p.preference_type = 'age_range'        THEN p.preference_value END) AS age_range,
    MAX(CASE WHEN p.preference_type = 'demographic_type' THEN p.preference_value END) AS demographic_type
  FROM preferences p
  WHERE p.preference_type IN ('name', 'age_range', 'demographic_type')
  GROUP BY p.user_id
`);

console.log(`   Found ${prefRows.length} user(s) with demographic prefs to migrate`);

for (const row of prefRows) {
  await client.query(
    `UPDATE users
     SET name             = COALESCE($1, name),
         age_range        = COALESCE($2, age_range),
         demographic_type = COALESCE($3, demographic_type)
     WHERE user_id = $4`,
    [row.name, row.age_range, row.demographic_type, row.user_id]
  );
  console.log(`   ✓ ${row.user_id}: name=${row.name} age=${row.age_range} demo=${row.demographic_type}`);
}

// ── 3. Delete redundant preference rows ──────────────────────────────────────
console.log("\n3. Deleting redundant demographic preference rows...");
const { rowCount } = await client.query(`
  DELETE FROM preferences
  WHERE preference_type IN ('name', 'age_range', 'demographic_type')
`);
console.log(`   ✓ Deleted ${rowCount} row(s)`);

// ── 4. Verify final state ─────────────────────────────────────────────────────
console.log("\n4. Final users table state:");
const { rows: users } = await client.query(
  `SELECT email, name, age_range, demographic_type FROM users ORDER BY created_at`
);
for (const u of users) {
  console.log(`   ${u.email}: name=${u.name ?? "(null)"} age=${u.age_range ?? "(null)"} demo=${u.demographic_type ?? "(null)"}`);
}

await client.end();
console.log("\n✅ Migration complete!");
