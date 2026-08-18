import { signOut } from "../api/google/sign-out";

export async function performSignOut() {
  try {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      await signOut(refresh);
    }
  } finally {
    // Clear both old and new key names to be safe
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token");
    localStorage.removeItem("account");
  }
}