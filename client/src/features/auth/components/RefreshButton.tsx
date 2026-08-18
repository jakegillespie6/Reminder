import { refreshToken } from "../api";

interface Props {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export default function RefreshButton({ onSuccess, onError }: Props) {
  const handleRefresh = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) throw new Error("No refresh token found.");

      const tokens = await refreshToken(refresh);

      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);

      onSuccess?.();
    } catch (error) {
      onError?.(error);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      className="
        rounded-md
        bg-accent
        px-4 py-2
        text-sm font-medium
        text-accent-foreground
        transition-colors
        hover:bg-accent-hover
      "
    >
      Refresh token
    </button>
  );
}