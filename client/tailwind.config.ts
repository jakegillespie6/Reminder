import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],

  theme: {
    extend: {
      colors: {
        /* Backgrounds */
        "background-primary":
          "rgb(var(--color-background-primary) / <alpha-value>)",
        "background-secondary":
          "rgb(var(--color-background-secondary) / <alpha-value>)",
        "background-tertiary":
          "rgb(var(--color-background-tertiary) / <alpha-value>)",

        /* Surfaces */
        surface:
          "rgb(var(--color-surface) / <alpha-value>)",
        "surface-elevated":
          "rgb(var(--color-surface-elevated) / <alpha-value>)",

        /* Text */
        "text-primary":
          "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary":
          "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-tertiary":
          "rgb(var(--color-text-tertiary) / <alpha-value>)",
        "text-accent":
          "rgb(var(--color-text-accent) / <alpha-value>)",

        /* Accent */
        accent:
          "rgb(var(--color-accent) / <alpha-value>)",
        "accent-hover":
          "rgb(var(--color-accent-hover) / <alpha-value>)",
        "accent-foreground":
          "rgb(var(--color-accent-foreground) / <alpha-value>)",

        /* Borders */
        border:
          "rgb(var(--color-border) / <alpha-value>)",
        "border-strong":
          "rgb(var(--color-border-strong) / <alpha-value>)",

        /* Status */
        success:
          "rgb(var(--color-success) / <alpha-value>)",
        warning:
          "rgb(var(--color-warning) / <alpha-value>)",
        danger:
          "rgb(var(--color-danger) / <alpha-value>)",
        info:
          "rgb(var(--color-info) / <alpha-value>)",
      },
    },
  },

  plugins: [],
} satisfies Config;