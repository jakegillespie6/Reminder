import { useNavigate } from "react-router-dom";
import { performSignOut } from "../utils/performSignOut";

interface Props {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export default function SignOutButton({ onSuccess, onError }: Props) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await performSignOut();
      onSuccess?.();
    } catch (error) {
      onError?.(error);
    } finally {
      navigate("/sign-in/", { replace: true });
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="
        rounded-md
        border border-danger/40
        bg-danger
        px-4 py-2
        text-sm font-medium
        text-white
        transition-opacity
        hover:opacity-90
      "
    >
      Sign out
    </button>
  );
}