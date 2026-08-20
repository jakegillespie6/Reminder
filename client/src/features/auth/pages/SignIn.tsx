import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import SignInButton from "../components/SignInButton";
import { devicePoll, deviceStart, me } from "../api";
import toast from "react-hot-toast";

type DeviceSession = {
  session_id: string;
  poll_token: string;
  verification_uri: string;
  expires_at: string;
};

export default function SignIn() {
  const navigate = useNavigate();
  const [deviceSession, setDeviceSession] = useState<DeviceSession | null>(null);
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    me().then(() => navigate("/")).catch(() => {});
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const s = await deviceStart();
        if (cancelled) return;
        setDeviceSession(s);

        pollTimer.current = window.setInterval(async () => {
          try {
            const { data, httpStatus } = await devicePoll({
              session_id: s.session_id,
              poll_token: s.poll_token,
            });

            if (httpStatus === 202 || data.status === "pending") return;

            if (data.status === "approved") {
              localStorage.setItem("access_token", data.tokens.access);
              localStorage.setItem("refresh_token", data.tokens.refresh);
              localStorage.setItem("account", JSON.stringify(data.account));
              toast.success("Signed in successfully");
              navigate("/");
            }
          } catch {
            // optional: show an error once
          }
        }, 2500);
      } catch {
        toast.error("Failed to start QR sign-in");
      }
    };

    start();

    return () => {
      cancelled = true;
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-10 text-center shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">Welcome Back</h1>
        <p className="mb-8 text-text-secondary">Sign in to your account</p>

        <SignInButton
          onSuccess={() => {
            toast.success("Signed in successfully");
            navigate("/");
          }}
          onError={() => toast.error("Sign in failed. Please try again.")}
        />

        <div className="my-6 border-t border-border pt-6">
          <p className="mb-3 text-base text-text-secondary">Or scan with your phone</p>
          {deviceSession && (
            <div className="flex flex-col items-center gap-3">
              <QRCodeCanvas value={deviceSession.verification_uri} size={180} />
              <p className="text-xs text-text-secondary">
                Open camera, scan QR, approve sign-in
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-base text-text-secondary">
          Don't have an account?{" "}
          <span
            className="cursor-pointer font-medium text-text-accent hover:underline"
            onClick={() => navigate("/sign-up/")}
          >
            Sign up here
          </span>
        </p>
      </div>
    </div>
  );
}