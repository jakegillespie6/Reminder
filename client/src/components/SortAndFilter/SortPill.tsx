import { BsSortDown, BsSortUp } from "react-icons/bs";

type SortDirection = "asc" | "desc";

type SortPillProps = {
  field: string;
  direction: SortDirection;
  className?: string;
};

export default function SortPill({ field, direction, className = "" }: SortPillProps) {
  const Icon = direction === "desc" ? BsSortDown : BsSortUp;

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
      <Icon aria-hidden="true" className="h-4 w-4 text-accent" />
      <span className="font-medium">{field}</span>
    </span>
  );
}