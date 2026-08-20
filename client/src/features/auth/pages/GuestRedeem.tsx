import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { redeemGuestPass } from "../api/guestPass";

type RedeemState = "loading" | "success" | "error";

export default function GuestRedeem() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<RedeemState>("loading");
  const [message, setMessage] = useState("Redeeming guest pass...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!code) {
        setState("error");
        setMessage("Missing guest pass code.");
        return;
      }

      try {
        const payload = await redeemGuestPass(code);
        if (cancelled) return;

        localStorage.setItem("access_token", payload.access);
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("account");

        setState("success");
        setMessage("Guest access granted. Redirecting...");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 900);
      } catch (err) {
        if (cancelled) return;

        let detail = "This guest pass is invalid or expired.";
        if (isAxiosError(err)) {
          detail =
            (err.response?.data as { detail?: string } | undefined)?.detail ??
            detail;
        }

        setState("error");
        setMessage(detail);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary p-6 text-text-primary">
      <div className="w-full max-w-md rounded-lg border border-border-primary bg-background-secondary p-6 text-center shadow-sm">
        <h1 className="mb-3 text-lg font-semibold">Guest Pass</h1>
        <p className="text-sm">{message}</p>

        {state === "error" && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-accent-primary px-4 py-2 text-sm text-white"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}