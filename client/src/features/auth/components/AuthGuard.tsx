import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { me } from "../api/me";

export default function AuthGuard() {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const access = localStorage.getItem("access_token");
      if (!access) {
        navigate("/sign-in", { replace: true });
        if (!cancelled) setChecking(false);
        return;
      }

      try {
        await me(); // works for normal user OR guest
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/sign-in", { replace: true });
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checking) return null;
  return <Outlet />;
}