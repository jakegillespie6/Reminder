import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { redeemGuestPass } from "../api/guestPass";

type RedeemState = "loading" | "success" | "error";

export default function GuestRedeem() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<RedeemState>("loading");
  const [message, setMessage] = useState("Redeeming guest pass...");

  useEffect(() => {
    if (!code) {
      setState("error");
      setMessage("Missing guest pass code.");
      return;
    }

    const doneKey = `guest_redeem_done:${code}`;
    const lockKey = `guest_redeem_lock:${code}`;

    // Only skip if this exact code already completed
    if (sessionStorage.getItem(doneKey) === "1") {
      window.location.replace("/");
      return;
    }

    // StrictMode duplicate mount protection
    if (sessionStorage.getItem(lockKey) === "1") {
      setMessage("Finalizing guest sign-in...");
      return;
    }

    sessionStorage.setItem(lockKey, "1");
    let cancelled = false;

    (async () => {
      try {
        const payload = await redeemGuestPass(code);

        localStorage.setItem("access_token", payload.access);
        localStorage.removeItem("refresh_token");
        sessionStorage.setItem(doneKey, "1");
        sessionStorage.removeItem(lockKey);

        if (!cancelled) {
          setState("success");
          setMessage("Guest access granted. Redirecting...");
        }

        window.location.replace("/");
      } catch (err) {
        sessionStorage.removeItem(lockKey);
        if (!cancelled) {
          const detail =
            isAxiosError(err) && typeof err.response?.data?.detail === "string"
              ? err.response.data.detail
              : "This guest pass is invalid or expired.";

          setState("error");
          setMessage(detail);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="rounded-lg border p-6 text-center">
        <h1 className="mb-2 text-lg font-semibold">Guest Pass</h1>
        <p className="text-sm">{message}</p>
        {state === "error" && (
          <button className="mt-4 rounded px-3 py-2 border" onClick={() => window.location.reload()}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}