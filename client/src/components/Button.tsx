import React, { useState } from "react";
import { IconType } from "react-icons";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps {
  label: string;
  onClick: () => Promise<void> | void;
  onSuccess?: (message?: string) => void;
  onError?: (error?: unknown) => void;
  icon?: IconType;
  iconPosition?: "left" | "right";
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent hover:bg-accent-hover text-accent-foreground border border-accent",

  secondary:
    "bg-surface hover:bg-surface-elevated text-text-primary border border-border",

  danger:
    "bg-danger hover:opacity-90 text-white border border-danger",
};

const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  onSuccess,
  onError,
  icon: Icon,
  iconPosition = "left",
  variant = "primary",
  disabled = false,
  className = "",
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;

    setLoading(true);

    try {
      await onClick();
      onSuccess?.();
    } catch (error) {
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-2 rounded-md px-4 py-2
        text-sm font-medium
        transition-colors duration-150
        focus:outline-none
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {Icon && iconPosition === "left" && (
        <Icon className={loading ? "opacity-50" : ""} />
      )}

      {loading ? "Loading..." : label}

      {Icon && iconPosition === "right" && (
        <Icon className={loading ? "opacity-50" : ""} />
      )}
    </button>
  );
};

export default Button;