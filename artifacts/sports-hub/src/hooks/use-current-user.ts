import { useQuery } from "@tanstack/react-query";

export interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  interests: string[];
  hasSportsInterest: boolean;
}

function getStoredUserId(): string | null {
  try {
    return localStorage.getItem("signalos_user_id");
  } catch {
    return null;
  }
}

export function useCurrentUser() {
  const userId = getStoredUserId();

  const { data, isLoading } = useQuery<CurrentUser>({
    queryKey: ["/api/user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json() as Promise<CurrentUser>;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: data ?? null,
    isLoading: !!userId && isLoading,
    userId,
  };
}
