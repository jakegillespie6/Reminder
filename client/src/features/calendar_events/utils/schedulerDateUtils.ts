import type { CalendarView as GlobalCalendarView } from "@features/global-settings/types";

export type CalendarView = "day" | "week" | "month" | "agenda";

export const VIEW_MAP_TO_GLOBAL: Record<CalendarView, GlobalCalendarView> = {
  day: "daily",
  week: "weekly",
  month: "monthly",
  agenda: "agenda",
};

export const VIEW_MAP_FROM_GLOBAL: Record<GlobalCalendarView, CalendarView> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  agenda: "agenda",
};

export function calculateDateRange(
  date: Date,
  view: CalendarView,
): { start_date: string; end_date: string } {
  const start = new Date(date);

  if (view === "day") {
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };
  }

  if (view === "month") {
    const year = start.getFullYear();
    const month = start.getMonth();
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return {
      start_date: monthStart.toISOString(),
      end_date: monthEnd.toISOString(),
    };
  }

  // "week" or "agenda" (Sunday -> Saturday)
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start_date: start.toISOString(),
    end_date: end.toISOString(),
  };
}

export type EventMenuPoint = {
  x: number;
  y: number;
};

export function getEventMenuPoint(eventDetails: any): EventMenuPoint {
  const source =
    eventDetails?.event ??
    eventDetails?.nativeEvent ??
    eventDetails?.domEvent ??
    eventDetails?.originalEvent;

  if (
    typeof source?.clientX === "number" &&
    typeof source?.clientY === "number"
  ) {
    return {
      x: source.clientX,
      y: source.clientY,
    };
  }

  const element =
    eventDetails?.element ??
    eventDetails?.eventElement ??
    source?.currentTarget ??
    source?.target;

  if (element instanceof HTMLElement) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}