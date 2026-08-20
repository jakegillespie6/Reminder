import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { deviceApprove } from "../api/device";

export default function DeviceVerify() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onApprove = async () => {
    const access = localStorage.getItem("access_token");
    if (!sessionId || !access) {
      toast.error("Sign in on this phone first.");
      navigate("/sign-in");
      return;
    }

    setLoading(true);
    try {
      await deviceApprove({ session_id: sessionId });
      toast.success("Device approved. You can return to the other device.");
    } catch {
      toast.error("Could not approve device.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border p-6 text-center">
        <h1 className="mb-2 text-xl font-semibold">Approve sign-in</h1>
        <p className="mb-4 text-base">Approve login for the other device?</p>
        <button className="rounded bg-black px-4 py-2 text-white" disabled={loading} onClick={onApprove}>
          {loading ? "Approving..." : "Approve"}
        </button>
      </div>
    </div>
  );
}