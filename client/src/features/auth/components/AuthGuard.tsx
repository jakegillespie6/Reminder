import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { me } from "../api/me";

export default function AuthGuard() {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    me()
      .then(() => setChecking(false))
      .catch(() => navigate("/sign-in/"));
  }, []);

  if (checking) return <div>Loading...</div>;

  return <Outlet />;
}