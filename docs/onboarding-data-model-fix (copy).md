# Onboarding Data Model Fix

## Summary

Moved `name`, `age_range`, and `demographic_type` from the `preferences` table into proper columns on the `users` table, migrated any existing data, and updated the backend route to write these fields correctly.

---

## Problem

The initial onboarding implementation stored demographic fields as rows in the `preferences` table:

| preference_type    | preference_value |
|--------------------|------------------|
| name               | Sean             |
| age_range          | 26-35            |
| demographic_type   | Professional     |

These are user identity fields — not preferences — and belong as columns on the `users` row.

---

## Schema Change

Run once in the Supabase SQL Editor:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name             TEXT,
  ADD COLUMN IF NOT EXISTS age_range        TEXT,
  ADD COLUMN IF NOT EXISTS demographic_type TEXT;
```

**Final `users` table columns:**

| Column            | Type      | Notes                        |
|-------------------|-----------|------------------------------|
| user_id           | UUID (PK) | Auto-generated               |
| email             | TEXT      | Unique, required             |
| name              | TEXT      | Added — from onboarding      |
| age_range         | TEXT      | Added — e.g. "26-35"        |
| demographic_type  | TEXT      | Added — e.g. "Professional" |
| created_at        | TIMESTAMPTZ | Auto                       |
| updated_at        | TIMESTAMPTZ | Auto                       |

---

## Data Migration

Moved existing demographic rows from `preferences` → `users` columns, then deleted the redundant rows.

**Script:** `artifacts/api-server/scripts/migrate-users-columns.mjs`

Steps performed:
1. Fetched all `preferences` rows where `preference_type IN ('name', 'age_range', 'demographic_type')`
2. Grouped by `user_id`
3. `PATCH`-ed each user's row in `users` with the grouped values
4. `DELETE`-ed those preference rows

---

## Backend Change

**File:** `artifacts/api-server/src/routes/onboarding.ts`

### Before

```ts
// Demographic fields written as preference rows
prefs.push({ user_id, preference_type: "name",             preference_value: name,             weight: 1 });
prefs.push({ user_id, preference_type: "age_range",        preference_value: ageRange,        weight: 1 });
prefs.push({ user_id, preference_type: "demographic_type", preference_value: demographicType, weight: 1 });
```

### After

```ts
// Existing user — UPDATE the users row directly
await supabase
  .from("users")
  .update({ name, age_range: ageRange, demographic_type: demographicType })
  .eq("user_id", userId);

// New user — INSERT with demographics included
await supabase
  .from("users")
  .insert({ email, name, age_range: ageRange, demographic_type: demographicType });

// Preferences only receive interest/interest_note rows
await supabase
  .from("preferences")
  .delete()
  .eq("user_id", userId)
  .in("preference_type", ["interest", "interest_note"]);
```

---

## Final Data Layout

### `users` table

| email               | name  | age_range | demographic_type |
|---------------------|-------|-----------|------------------|
| sean@signalos.app   | Sean  | 26-35     | Professional     |

### `preferences` table (Sean)

| preference_type | preference_value       |
|-----------------|------------------------|
| favorite_team   | steelers               |
| favorite_team   | rockets                |
| favorite_team   | astros                 |
| liked_category  | trades                 |
| liked_category  | injuries               |
| interest        | sports:Football        |
| interest        | sports:Basketball      |
| interest        | technology:AI          |
| interest_note   | sports:Go Steelers!    |

Demographic fields (`name`, `age_range`, `demographic_type`) no longer appear in `preferences`.

---

## Verification

```
POST /api/onboarding
→ { "userId": "526a125c-...", "message": "Onboarding complete" }

users row: name=Sean, age_range=26-35, demographic_type=Professional ✓
preferences: only interest/favorite_team/liked_category rows ✓
Dashboard loads correctly after onboarding ✓
```
