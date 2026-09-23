import { Box, Typography } from "@mui/material";

import type { EventOccurrence } from "../../types";

interface Props {
  occurrences: EventOccurrence[];
  now: number;
}

export function CalendarTodaySummary({
  occurrences,
  now,
}: Props) {
  const nextOccurrence = occurrences
    .filter(
      (occurrence) =>
        !occurrence.complete &&
        new Date(occurrence.end_date).getTime() >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() -
        new Date(b.start_date).getTime(),
    )[0];

  return (
    <div className="box-border w-full shrink-0 rounded-lg border border-border bg-surface p-4 shadow-lg">
      <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
        Today
      </p>

      <h2 className="text-xl font-semibold">
        {new Date(now).toLocaleDateString(undefined, {
          weekday: "short",
          month: "long",
          day: "numeric",
        })}
      </h2>

      <div className="mt-2">
        <p className="block text-xs text-text-secondary">
          Next upcoming
        </p>

        {nextOccurrence ? (
          <>
            <p className="truncate text-sm font-semibold">
              {nextOccurrence.title || "Untitled"}
            </p>

            <p className="text-xs text-text-secondary">
              {nextOccurrence.timing_type === "all_day"
                ? "All day"
                : new Date(
                    nextOccurrence.start_date,
                  ).toLocaleString(undefined, {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
            </p>
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            No upcoming events
          </p>
        )}
      </div>
    </div>
  );
}