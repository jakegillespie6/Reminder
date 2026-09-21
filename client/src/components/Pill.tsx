import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export type PillProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  highlight?: boolean;
  completed?: boolean;
  interactive?: boolean;
  contentClassName?: string;
};

const Pill = forwardRef<HTMLDivElement, PillProps>(
  (
    {
      children,
      highlight = false,
      completed = false,
      interactive = false,
      className = "",
      contentClassName = "",
      ...props
    },
    ref,
  ) => {
    const stateClasses = highlight
      ? ""
      : "border-accent bg-background-tertiary shadow-sm";

    const interactiveClasses = interactive
      ? [
          "cursor-pointer touch-manipulation",
          "hover:border-accent/40 hover:bg-accent/10",
          "group-aria-expanded:border-accent",
          "group-aria-expanded:bg-accent/20",
          "group-aria-expanded:hover:bg-accent/60",
        ].join(" ")
      : "";

    return (
      <div
        ref={ref}
        className={[
          "relative inline-flex select-none items-center gap-2",
          "rounded-full border px-3 py-1",
          "text-base text-accent",
          "transition-all duration-300",
          stateClasses,
          interactiveClasses,
          className,
        ].join(" ")}
        {...props}
      >
        <span
          className={[
            "max-w-[220px] truncate",
            completed ? "line-through opacity-70" : "",
            contentClassName,
          ].join(" ")}
        >
          {children}
        </span>
      </div>
    );
  },
);

Pill.displayName = "Pill";

export default Pill;