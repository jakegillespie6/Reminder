import { IoFilter } from "react-icons/io5";

type FilterPillProps = {
  label: string;
  value?: string;
  className?: string;
};

export default function FilterPill({ label, value, className = "" }: FilterPillProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-2
        rounded-md
        border border-accent/50
        bg-accent/10
        px-3 py-1
        text-sm text-text-secondary
        shadow-sm
        ${className}
      `}
    >
      <IoFilter aria-hidden="true" className="h-4 w-4 text-accent" />
      <span className="font-medium">{label}</span>
      {value ? <span className="text-text-primary">: {value}</span> : null}
    </span>
  );
}