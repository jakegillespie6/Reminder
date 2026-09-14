import type { CalendarFilters, CalendarView } from "./types";

export const toISODate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const startOfWeek = (d: Date): Date => {
  const copy = new Date(d);
  // Monday-first week.
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
};

export const computeRange = (
  view: CalendarView,
  anchorDate: string
): { start_date: string; end_date: string } => {
  const anchor = new Date(`${anchorDate}T00:00:00`);
  const start = new Date(anchor);
  const end = new Date(anchor);

  switch (view) {
    case "day":
      break;

    case "week": {
      const ws = startOfWeek(anchor);
      start.setTime(ws.getTime());
      end.setTime(ws.getTime());
      end.setDate(end.getDate() + 6);
      break;
    }

    case "month":
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
      break;

    case "year":
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
  }

  return { start_date: toISODate(start), end_date: toISODate(end) };
};

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  view: "month",
  anchor_date: toISODate(new Date()),
  show_completed: true,
  sources: [],
};

export const normalizeCalendarFilters = (value: unknown): CalendarFilters => {
  if (!value || typeof value !== "object") return { ...DEFAULT_CALENDAR_FILTERS };

  const raw = value as Record<string, unknown>;
  const next: CalendarFilters = { ...DEFAULT_CALENDAR_FILTERS };

  if (
    typeof raw.view === "string" &&
    ["day", "week", "month", "year"].includes(raw.view)
  ) {
    next.view = raw.view as CalendarView;
  }

  if (typeof raw.anchor_date === "string" && raw.anchor_date.length >= 10) {
    next.anchor_date = raw.anchor_date.slice(0, 10);
  }

  if (typeof raw.show_completed === "boolean") {
    next.show_completed = raw.show_completed;
  }

  if (Array.isArray(raw.sources)) {
    next.sources = raw.sources.filter(
      (s): s is CalendarFilters["sources"][number] => typeof s === "string"
    );
  }

  return next;
};

export const areCalendarFiltersEqual = (
  a: CalendarFilters,
  b: CalendarFilters
): boolean =>
  a.view === b.view &&
  a.anchor_date === b.anchor_date &&
  a.show_completed === b.show_completed &&
  a.sources.length === b.sources.length &&
  a.sources.every((s, i) => s === b.sources[i]);