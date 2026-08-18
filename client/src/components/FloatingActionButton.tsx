import React from "react";

type FabPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "bottom-center"
  | "top-center";

type FabSize = "small" | "medium" | "large";

type FloatingActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  position?: FabPosition;
  size?: FabSize;
  disabled?: boolean;
  className?: string;
  tooltip?: boolean;
  style?: React.CSSProperties;
};

const positionClasses: Record<FabPosition, string> = {
  "bottom-right": "right-6 bottom-6",
  "bottom-left": "left-6 bottom-6",
  "top-right": "right-6 top-6",
  "top-left": "left-6 top-6",
  "bottom-center": "left-1/2 -translate-x-1/2 bottom-6",
  "top-center": "left-1/2 -translate-x-1/2 top-6",
};

const sizeClasses: Record<FabSize, string> = {
  small: "w-10 h-10 text-lg",
  medium: "w-14 h-14 text-[1.4rem]",
  large: "w-[72px] h-[72px] text-[1.4rem]",
};


export default function FloatingActionButton({
  icon,
  label,
  onClick,
  position = "bottom-right",
  size = "medium",
  disabled = false,
  className = "",
  tooltip = true,
  style,
}: FloatingActionButtonProps) {
  const classes = [
    // changed: z-[1300] -> z-30 so modal/dropdowns can appear above FAB
    "fixed z-[1000] inline-flex items-center justify-center rounded-full border-0 bg-accent text-white",
    "shadow-[0_6px_14px_rgba(0,0,0,0.28),0_2px_4px_rgba(0,0,0,0.2)]",
    "transition-all duration-150",
    "hover:brightness-[1.03] hover:-translate-y-[1px]",
    "active:translate-y-0",
    "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(25,118,210,0.35)]",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    positionClasses[position],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      aria-label={label}
      title={tooltip ? label : undefined}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      <span className="inline-flex items-center justify-center leading-none select-none">
        {icon}
      </span>
    </button>
  );
}