import { createContext, useContext, useEffect, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectTheme } from "@features/global-settings/store/selectors";
import { updateTheme } from "@features/global-settings/store/thunks";
import type { Theme as GlobalTheme } from "@features/global-settings/types";

export type Theme = GlobalTheme;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "app-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const themeFromState = useAppSelector(selectTheme);

  // If fetch fails / state is empty, default to light
  const theme: Theme = themeFromState ?? "light";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      void dispatch(updateTheme(nextTheme));
    },
    [dispatch]
  );

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}