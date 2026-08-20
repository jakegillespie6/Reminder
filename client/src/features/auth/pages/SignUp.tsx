import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SignUpButton from "../components/SignUpButton";
import { me } from "../api/me";
import toast from "react-hot-toast";

export default function SignUp() {
  const navigate = useNavigate();

  useEffect(() => {
    me().then(() => navigate("/")).catch(() => {});
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-md">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">
          Create an Account
        </h1>

        <p className="mb-6 text-text-secondary">
          Get started today
        </p>

        <SignUpButton
          onSuccess={() => {
            toast.success("Account created successfully");
            navigate("/");
          }}
          onError={() => {
            toast.error("Sign up failed. Please try again.");
          }}
        />

        <p className="mt-6 text-base text-text-secondary">
          Already have an account?{" "}
          <span
            className="cursor-pointer text-text-accent hover:underline"
            onClick={() => navigate("/sign-in/")}
          >
            Sign in here
          </span>
        </p>
      </div>
    </div>
  );
}