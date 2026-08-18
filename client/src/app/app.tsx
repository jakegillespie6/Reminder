// src/app/App.tsx
import { RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import { router } from "./router";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./theme/ThemeProvider";
import { useAppDispatch } from "@store/hooks";
import {
  fetchTheme,
  fetchCalendar,
  fetchItemFilters,
} from "@features/global-settings/store/thunks";

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initial settings fetch on app open
    void dispatch(fetchTheme());
    void dispatch(fetchCalendar());
    void dispatch(fetchItemFilters());
  }, [dispatch]);

  return (
    <ThemeProvider>
      <Toaster position="top-center" />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}