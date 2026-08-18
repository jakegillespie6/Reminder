import { useQuery } from "@tanstack/react-query";
import { me } from "../api/me";

export function useCurrentAccount() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: me,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}