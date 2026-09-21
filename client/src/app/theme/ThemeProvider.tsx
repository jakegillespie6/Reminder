import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material";
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
  const theme: Theme = themeFromState ?? "light";

  const muiTheme = useMemo(() => {
    const isDark = theme !== "light";

    return createTheme({
      palette: {
        mode: isDark ? "dark" : "light",
        background: {
          default: "rgb(var(--color-background-primary))",
          paper: "rgb(var(--color-surface))",
        },
        text: {
          primary: "rgb(var(--color-text-primary))",
          secondary: "rgb(var(--color-text-secondary))",
        },
        divider: "rgb(var(--color-border))",
        primary: {
          main: "rgb(var(--color-accent))",
          contrastText: "rgb(var(--color-accent-foreground))",
        },
        success: {
          main: "rgb(var(--color-success))",
        },
        warning: {
          main: "rgb(var(--color-warning))",
        },
        error: {
          main: "rgb(var(--color-danger))",
        },
        info: {
          main: "rgb(var(--color-info))",
        },
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              backgroundColor: "rgb(var(--color-surface))",
            },
          },
        },
      },
    });
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      void dispatch(updateTheme(nextTheme));
    },
    [dispatch],
  );

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    </MuiThemeProvider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return ctx;
}