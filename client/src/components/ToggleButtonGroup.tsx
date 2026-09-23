const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export type ToggleOption<T extends string> = {
  value: T;
  label: string;
};

type ToggleButtonGroupProps<T extends string> = {
  value: T;
  options: ReadonlyArray<ToggleOption<T>>;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export default function ToggleButtonGroup<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  className,
  label,
}: ToggleButtonGroupProps<T>) {
  return (
    <div>
      {label ? (
        <div className="mb-1 text-xs font-medium text-text-primary">{label}</div>
      ) : null}

      <div
        role="tablist"
        aria-label={label ?? "Toggle options"}
        className={cn(
          "grid w-full overflow-hidden rounded-md border border-border",
          "grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-px",
          className
        )}
      >
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={cn(
                "min-w-0 px-3 py-1.5 text-center text-base font-medium transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isActive
                  ? "bg-accent text-white"
                  : "bg-background-tertiary text-text-primary hover:bg-surface-elevated"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}