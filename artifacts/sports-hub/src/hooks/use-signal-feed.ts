import { useQuery } from "@tanstack/react-query";

export interface SignalItem {
  signal_id: string;
  source_domain: string;
  category: string;
  headline: string;
  summary: string;
  signal_score: number;
  reasons: string[];
  created_at: string;
}

export function useSignalFeed(domains: string[]) {
  const enabled = domains.length > 0;
  const domainsKey = domains.slice().sort().join(",");

  const { data, isLoading } = useQuery<SignalItem[]>({
    queryKey: ["/api/signals", domainsKey],
    queryFn: async () => {
      const res = await fetch(`/api/signals?domains=${encodeURIComponent(domainsKey)}&limit=40`);
      if (!res.ok) throw new Error("Failed to fetch signals");
      return res.json() as Promise<SignalItem[]>;
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  return {
    signals: data ?? [],
    isLoading: enabled && isLoading,
  };
}
