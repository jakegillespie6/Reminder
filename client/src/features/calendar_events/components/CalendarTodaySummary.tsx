import { Box, Typography } from "@mui/material";
import type { EventOccurrence } from "../types";

interface Props {
  occurrences: EventOccurrence[];
  now: number;
}

export function CalendarTodaySummary({ occurrences, now }: Props) {
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
    <Box
      sx={{
        position: "absolute",
        top: 325,
        left: 0,
        zIndex: 2,
        width: 250,
        boxSizing: "border-box",
        p: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        boxShadow: 1,
      }}
    >
      <Typography variant="overline" color="text.secondary">
        Today
      </Typography>

      <Typography variant="h6">
        {new Date(now).toLocaleDateString(undefined, {
          weekday: "short",
          month: "long",
          day: "numeric",
        })}
      </Typography>

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Next upcoming
        </Typography>

        {nextOccurrence ? (
          <>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {nextOccurrence.title || "Untitled"}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {nextOccurrence.timing_type === "all_day"
                ? "All day"
                : new Date(nextOccurrence.start_date).toLocaleString(
                    undefined,
                    {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No upcoming events
          </Typography>
        )}
      </Box>
    </Box>
  );
}