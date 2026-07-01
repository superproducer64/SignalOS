import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  interests: string[];
  hasSportsInterest: boolean;
  /** Non-sports domain prefixes derived from interests, e.g. ["technology", "lifestyle"] */
  signalDomains: string[];
  onboardingComplete: boolean;
}

/** undefined = still checking for an existing session, null = signed out */
function useSupabaseSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return session;
}

export function useCurrentUser() {
  const session = useSupabaseSession();
  const sessionLoading = session === undefined;
  const userId = session?.user.id ?? null;
  const accessToken = session?.access_token ?? null;

  const { data, isLoading: queryLoading } = useQuery<CurrentUser | null>({
    queryKey: ["/api/user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json() as Promise<CurrentUser>;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: data ?? null,
    isLoading: sessionLoading || (!!userId && queryLoading),
    isAuthenticated: !!session,
    userId,
  };
}
