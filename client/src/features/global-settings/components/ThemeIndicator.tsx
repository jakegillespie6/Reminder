import { useTheme } from "../../../app/theme/ThemeProvider";
import { FaAtom, FaMoon } from "react-icons/fa";
import { IoSunny } from "react-icons/io5";

const themeMeta = {
  light: { label: "Light", Icon: IoSunny },
  dark: { label: "Dark", Icon: FaMoon },
  abyssal: { label: "Abyssal", Icon: FaAtom },
} as const;

export default function ThemeIndicator() {
  const { theme } = useTheme();
  const current = themeMeta[theme] ?? themeMeta.light;
  const Icon = current.Icon;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-md border border-border bg-background-secondary px-2 py-1 text-sm text-text-primary"
      aria-label={`Current theme: ${current.label}`}
      title={`Current theme: ${current.label}`}
    >
      <Icon
        className="h-4 w-4 text-accent"
      />
      <span>{current.label}</span>
    </div>
  );
}