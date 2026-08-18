import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignInButton from "../components/SignInButton";
import { me } from "../api";
import toast from "react-hot-toast";

export default function SignIn() {
  const navigate = useNavigate();

  useEffect(() => {
    me()
      .then(() => navigate("/"))
      .catch(() => {
        // silent: expected when user is not signed in yet
      });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-10 text-center shadow-lg">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">
          Welcome Back
        </h1>

        <p className="mb-8 text-text-secondary">
          Sign in to your account
        </p>

        <SignInButton
          onSuccess={() => {
            toast.success("Signed in successfully");
            navigate("/");
          }}
          onError={() => {
            toast.error("Sign in failed. Please try again.");
          }}
        />

        <p className="mt-6 text-sm text-text-secondary">
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