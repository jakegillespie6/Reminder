import type { ReactNode } from "react";

type LabeledPanelProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export default function LabeledPanel({
  label,
  children,
  className = "",
}: LabeledPanelProps) {
  return (
    <fieldset
      className={`min-w-0 rounded-lg border border-border bg-surface p-4 ${className}`}
    >
      <legend className="px-2 text-sm font-semibold text-text-secondary">
        {label}
      </legend>

      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}