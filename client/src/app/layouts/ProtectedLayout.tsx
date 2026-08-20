import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { IoLogOutOutline } from "react-icons/io5";
import { useTheme, type Theme } from "../theme/ThemeProvider";
import PopoverMenu, { type PopoverMenuItem } from "../../components/PopoverMenu";
import type { Account } from "../../features/accounts/types";
import { performSignOut } from "../../features/auth/utils/performSignOut";
import { useCurrentAccount } from "../../features/auth/hooks/useCurrentAccount";
import ThemeIndicator from "../../features/global-settings/components/ThemeIndicator";

type GuestMe = {
  guest: true;
  guest_session_id: string;
  issuer: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
};

function isGuestMe(value: unknown): value is GuestMe {
  return !!value && typeof value === "object" && (value as GuestMe).guest === true;
}

function readJwtExpSeconds(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json) as { exp?: number };
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

function formatRemaining(seconds: number) {
  const clamped = Math.max(0, seconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ProtectedLayout() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentAccount();

  const guest = isGuestMe(currentUser);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const fullName = guest
    ? "Guest session"
    : currentUser
      ? `${(currentUser as Account).first_name} ${(currentUser as Account).last_name}`
      : "User";

  const initials = guest
    ? "G"
    : `${(currentUser as Account | undefined)?.first_name?.[0] ?? ""}${(currentUser as Account | undefined)?.last_name?.[0] ?? ""}`.toUpperCase() || "U";

  const handleSignOut = () => {
    void performSignOut().finally(() => {
      navigate("/sign-in/", { replace: true });
    });
  };

  const accountMenuItems: PopoverMenuItem[] = [
    {
      label: "Sign out",
      icon: <IoLogOutOutline className="h-4 w-4" aria-hidden />,
      onClick: handleSignOut,
      danger: true,
    },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-md px-3 py-2 text-base font-medium transition-colors ${
      isActive
        ? "bg-accent text-accent-foreground"
        : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
    }`;

  useEffect(() => {
    if (!guest) {
      setSecondsLeft(0);
      return;
    }

    const token = localStorage.getItem("access_token");
    const exp = readJwtExpSeconds(token);
    if (!exp) {
      setSecondsLeft(0);
      return;
    }

    const tick = () => {
      const remaining = Math.floor(exp - Date.now() / 1000);
      setSecondsLeft(Math.max(0, remaining));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [guest]);

  return (
    <div className="h-screen bg-background-primary text-text-primary">
      <header className="fixed inset-x-0 top-0 z-[5000] border-b border-border bg-surface">
        <div className="flex h-14 w-full items-center pl-2 pr-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="
              rounded-md
              p-2
              text-text-primary
              transition-colors
              hover:bg-surface-elevated
              focus:outline-none
              focus:ring-2
              focus:ring-accent/50
            "
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            <span className="mb-1 block h-0.5 w-5 bg-current" />
            <span className="mb-1 block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </button>

          <div className="ml-auto flex items-center gap-4">
            <ThemeIndicator />

            <PopoverMenu
              triggerLabel={`${fullName} menu`}
              items={accountMenuItems}
              trigger={
                <div className="flex items-center gap-2 rounded-full border border-border bg-background-secondary px-2 py-1 hover:bg-surface-elevated">
                  <span
                    className={`grid place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground ${
                      guest ? "h-7 min-w-[56px] px-2" : "h-7 w-7"
                    }`}
                    aria-hidden
                  >
                    {guest ? formatRemaining(secondsLeft) : initials}
                  </span>
                </div>
              }
            />
          </div>
        </div>
      </header>

      <aside
        className={`
          fixed left-0 top-14 z-[4900]
          h-[calc(100vh-3.5rem)]
          w-64
          border-r border-border
          bg-surface
          p-4
          transition-transform
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav className="space-y-2">
          <NavLink
            to="/"
            end
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            Home
          </NavLink>

          <NavLink
            to="/dashboard"
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            Dashboard
          </NavLink>
        </nav>
      </aside>

      {open && (
        <button
          type="button"
          className="fixed inset-0 top-14 z-[4800] bg-background-primary/70 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="pt-14 h-screen overflow-hidden">
        <div className="h-[calc(100vh-3.5rem)] overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}