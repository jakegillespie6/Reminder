import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const baseInputClass = `
  w-full
  rounded-md
  border border-border
  bg-background-tertiary
  px-3 py-2
  text-sm
  text-text-primary
  outline-none
  transition-colors
  placeholder:text-text-tertiary
  hover:border-border-strong
  focus:border-accent
  focus:ring-2
  focus:ring-accent/30
`;

export default function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={[baseInputClass, className].filter(Boolean).join(" ")}
    />
  );
}