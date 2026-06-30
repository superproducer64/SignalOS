---
name: Onboarding exit navigation
description: Why wouter navigate() fails after the onboarding gate flips, and the correct fix pattern.
---

After the onboarding localStorage gate flips, the React tree re-renders and wouter's Switch reads the *current browser URL* — which may still be a stale `/team/:id` from a prior tab session. A JS-only `navigate("/")` (wouter pushState) does not survive this re-render race.

**Rule:** After setting the onboarding-complete flag, use `window.location.replace(import.meta.env.BASE_URL)` (not `navigate()` and not `href=`). `replace()` forces a real browser navigation to the root AND removes the stale URL from history so browser Back cannot return to the card.

**Why:** `navigate()` is a pushState call — it updates the URL and signals wouter, but React's batched re-render may read the previous location before wouter's subscriber fires. Hard navigation sidesteps all of this.

**How to apply:** Any time an onboarding/auth gate flips via localStorage and the app needs to redirect to the root, use `window.location.replace(import.meta.env.BASE_URL)` in the completion callback, after the flag is written.
