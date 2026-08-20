import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { fetchTheme, updateTheme } from "../store/thunks";
import { selectTheme, selectThemeStatus } from "../store/selectors";
import type { Theme } from "../types";

export default function ThemeSettingsSection() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const status = useAppSelector(selectThemeStatus);

  const [themeDraft, setThemeDraft] = useState<Theme>("dark");

  useEffect(() => {
    void dispatch(fetchTheme());
  }, [dispatch]);

  useEffect(() => {
    if (theme) setThemeDraft(theme);
  }, [theme]);

  const onSaveTheme = async () => {
    const result = await dispatch(updateTheme(themeDraft));

    if (updateTheme.fulfilled.match(result)) {
      toast.success("Theme updated");
    } else {
      toast.error((result.payload as string) ?? "Theme update failed");
    }
  };

  const inputClass = `
    rounded-md
    border border-border
    bg-background-tertiary
    px-3 py-2
    text-base
    text-text-primary
    outline-none
    transition-colors
    placeholder:text-text-tertiary
    hover:border-border-strong
    focus:border-accent
    focus:ring-2
    focus:ring-accent/30
  `;

  const secondaryButtonClass = `
    rounded-md
    border border-border
    bg-surface
    px-3 py-2
    text-base font-medium
    text-text-primary
    transition-colors
    hover:border-border-strong
    hover:bg-surface-elevated
    disabled:cursor-not-allowed
    disabled:opacity-50
  `;

  return (
    <section className="space-y-4 rounded-lg border border-border bg-background-secondary p-4">
      <h2 className="text-lg font-semibold text-text-primary">Theme</h2>

      <div className="flex items-center gap-2">
        <label className="w-24 text-base text-text-secondary">Theme</label>

        <select
          value={themeDraft}
          onChange={(e) => setThemeDraft(e.target.value as Theme)}
          className={`w-full ${inputClass}`}
        >
          <option value="light">light</option>
          <option value="dark">dark</option>
          <option value="abyssal">abyssal</option>
        </select>

        <button
          onClick={() => void onSaveTheme()}
          disabled={status === "loading"}
          className={secondaryButtonClass}
        >
          Save
        </button>
      </div>
    </section>
  );
}