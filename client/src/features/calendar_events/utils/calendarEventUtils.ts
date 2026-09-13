import type { EventOccurrence, Weekday } from "../types";

export const WEEKDAYS: {
  value: Weekday;
  label: string;
}[] = [
  { value: "MO", label: "Mon" },
  { value: "TU", label: "Tue" },
  { value: "WE", label: "Wed" },
  { value: "TH", label: "Thu" },
  { value: "FR", label: "Fri" },
  { value: "SA", label: "Sat" },
  { value: "SU", label: "Sun" },
];

export function getOccurrenceId(
  occurrence: EventOccurrence
): string {
  return `${occurrence.event_id}:${occurrence.occurrence_date}`;
}

export function getFetchRange(visibleDate: Date) {
  const start = new Date(visibleDate);
  start.setDate(start.getDate() - 45);
  start.setHours(0, 0, 0, 0);

  const end = new Date(visibleDate);
  end.setDate(end.getDate() + 45);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function toDatetimeLocal(
  value: string | Date
): string {
  const date = value instanceof Date
    ? value
    : new Date(value);

  const pad = (value: number) =>
    String(value).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}