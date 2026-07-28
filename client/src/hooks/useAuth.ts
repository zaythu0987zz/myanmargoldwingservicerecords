import { trpc } from "@/lib/trpc";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetch();
      window.location.href = "/";
    },
  });

  return {
    user,
    loading: isLoading,
    error,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    startLogin: () => {
      const { getLoginUrl } = require("../const");
      window.location.href = getLoginUrl();
    },
  };
}
