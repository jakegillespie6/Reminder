import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { startGuestPass, type GuestPassStartResponse } from "../api/guestPass";

function formatSeconds(total: number) {
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function GuestPassQrCard() {
  const [pass, setPass] = useState<GuestPassStartResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const scheduleNext = (seconds: number) => {
      const ms = Math.max((seconds - 10) * 1000, 5000); // refresh 10s early
      refreshTimerRef.current = setTimeout(run, ms);
    };

    const run = async () => {
      try {
        const payload = await startGuestPass();
        if (cancelled) return;

        setPass(payload);
        setError(null);
        scheduleNext(payload.expires_in);
      } catch {
        if (cancelled) return;
        setError("Could not load guest pass.");
        refreshTimerRef.current = setTimeout(run, 15000);
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!pass) return;

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(pass.expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pass]);

  return (
    <div className="w-64 rounded-lg border border-border-primary bg-background-secondary p-3 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold">Guest Pass</h2>

      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      {!pass ? (
        <div className="flex h-40 items-center justify-center text-xs text-text-secondary">Generating QR...</div>
      ) : (
        <>
          <div className="flex justify-center rounded bg-white p-2">
            <QRCodeSVG value={pass.redeem_url} size={150} includeMargin />
          </div>
          <p className="mt-2 text-center text-xs text-text-secondary">
            Expires in {formatSeconds(secondsLeft)}
          </p>
        </>
      )}
    </div>
  );
}