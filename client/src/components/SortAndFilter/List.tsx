import { AnimatePresence, motion } from "framer-motion";
import type { ItemQueryParams } from "@features/items/types";
import FilterPill from "./FilterPill";
import SortPill from "./SortPill";

type SortDirection = "asc" | "desc";

type SortMeta = {
  field: string;
  direction: SortDirection;
};

type SortAndFilterListProps = {
  filters: ItemQueryParams;
  className?: string;
  emptyText?: string;
};

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const humanize = (value: string) =>
  value
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const parseSort = (sort?: string): SortMeta | null => {
  if (!sort) return null;
  const raw = sort.trim();
  if (!raw) return null;

  // -name / +name
  if (raw.startsWith("-")) return { field: humanize(raw.slice(1)), direction: "desc" };
  if (raw.startsWith("+")) return { field: humanize(raw.slice(1)), direction: "asc" };

  // name:desc / name:asc
  if (raw.includes(":")) {
    const [fieldRaw, dirRaw] = raw.split(":");
    const dir = dirRaw?.toLowerCase();
    const direction: SortDirection =
      dir === "desc" || dir === "descending" || dir === "dsc" || dir === "-1"
        ? "desc"
        : "asc";

    return { field: humanize(fieldRaw), direction };
  }

  return { field: humanize(raw), direction: "asc" };
};

export default function SortAndFilterList({
  filters,
  className = "",
  emptyText = "",
}: SortAndFilterListProps) {
  const filterPills: Array<{ key: string; label: string; value: string }> = [];

  if (filters.purchased !== undefined) {
    filterPills.push({
      key: "filter-purchased",
      label: "Purchased",
      value: filters.purchased ? "Yes" : "No",
    });
  }

  filters.store?.forEach((store) => {
    filterPills.push({
      key: `filter-store-${store}`,
      label: "Store",
      value: humanize(String(store)),
    });
  });

  filters.type?.forEach((type) => {
    filterPills.push({
      key: `filter-type-${type}`,
      label: "Type",
      value: humanize(String(type)),
    });
  });

  const sortMeta = parseSort(filters.sort);
  const hasAny = filterPills.length > 0 || !!sortMeta;

  return (
    <div
      className={`
        rounded-lg border border-border bg-background-secondary p-4 shadow-sm
        transition-colors hover:bg-surface-elevated
        ${className}
      `}
    >
      <div className="flex flex-wrap items-start gap-2">
        <span className="inline-flex h-7 items-center whitespace-nowrap text-xs font-medium text-text-secondary">
          Active filters:
        </span>

        {!hasAny ? (
          <p className="text-base text-text-tertiary">{emptyText}</p>
        ) : (
          <motion.div
            layout
            className="flex min-w-0 flex-1 flex-wrap gap-2"
            transition={{ layout: { duration: 0.22, ease: EASE_OUT } }}
          >
            <AnimatePresence initial={false}>
              {filterPills.map((pill) => (
                <motion.div
                  key={pill.key}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.88 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                >
                  <FilterPill label={pill.label} value={pill.value} />
                </motion.div>
              ))}

              {sortMeta ? (
                <motion.div
                  key={`sort-${sortMeta.field}-${sortMeta.direction}`}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.88 }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                >
                  <SortPill field={sortMeta.field} direction={sortMeta.direction} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}