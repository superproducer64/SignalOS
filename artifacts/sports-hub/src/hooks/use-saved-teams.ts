import { useState, useEffect } from "react";

const STORAGE_KEY = "sports-hub-saved-teams";

function loadSaved(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    // ignore
  }
  return new Set();
}

function persist(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function useSavedTeams() {
  const [saved, setSaved] = useState<Set<string>>(loadSaved);

  useEffect(() => {
    persist(saved);
  }, [saved]);

  const toggle = (teamId: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const isSaved = (teamId: string) => saved.has(teamId);

  return { isSaved, toggle };
}
