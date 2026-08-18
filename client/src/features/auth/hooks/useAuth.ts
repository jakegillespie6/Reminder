import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/auth/me/", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          setStatus("authenticated");
          navigate("/");
        } else {
          setStatus("unauthenticated");
          navigate("/sign-in/");
        }
      })
      .catch(() => {
        setStatus("unauthenticated");
        navigate("/sign-in/");
      });
  }, []);

  return { status };
}