import { Box, Button, Typography } from "@mui/material";
import { PopoverCard } from "@components/PopoverCard";
import Pill from "@components/Pill";
import type { EventOccurrence } from "../types";

type Props = {
  open: boolean;
  occurrence: EventOccurrence | null;
  anchorPoint: { x: number; y: number } | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onMarkComplete: () => void;
};

function formatAllDayDate(value: string | Date) {
  const date = new Date(value);

  return new Intl.DateTimeFormat(undefined, {
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function isRecurringEvent(occurrence: EventOccurrence) {
  const event = occurrence as unknown as Record<string, unknown>;

  return [
    "recurrence_rule",
    "recurrence",
    "rrule",
    "recurring_event_id",
    "parent_event_id",
  ].some((key) => {
    const value = event[key];
    return value !== undefined && value !== null && value !== false && value !== "";
  });
}

function getRecurrenceLabel(occurrence: EventOccurrence): string | null {
  const labels: Record<
    Exclude<EventOccurrence["recurrence"], "none">,
    string
  > = {
    daily: "Recurs Daily",
    weekly: "Recurs Weekly",
    monthly: "Recurs Monthly",
    yearly: "Recurs Yearly",
  };

  return occurrence.recurrence === "none"
    ? null
    : labels[occurrence.recurrence];
}

function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatEventDate(value: string | Date, includeTime: boolean) {
  const date = new Date(value);
  const timeZone = includeTime ? undefined : "UTC";

  const datePart = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone,
  })
    .format(date)
    .replace("Sep ", "Sept ");

  if (!includeTime) return datePart;

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${datePart} at ${timePart}`;
}

export function CalendarEventContextMenu({
  open,
  occurrence,
  anchorPoint,
  onOpenChange,
  onEdit,
  onMarkComplete,
}: Props) {
  if (!occurrence) return null;

  const isAllDay = occurrence.timing_type === "all_day";
  const recurrenceLabel = getRecurrenceLabel(occurrence);
  const startDate = formatEventDate(occurrence.start_date, !isAllDay);
  const endDate = formatEventDate(occurrence.end_date, !isAllDay);
  const allDayRange =
    startDate === endDate ? startDate : `${startDate} - ${endDate}`;

  return (
    <PopoverCard
      open={open}
      anchorPoint={anchorPoint}
      onOpenChange={onOpenChange}
      align="left"
      side="bottom"
      className="w-80"
      footer={
        <>
          <Button onClick={onEdit}>Edit</Button>
          <Button
            variant="contained"
            onClick={onMarkComplete}
            disabled={occurrence.complete}
          >
            {occurrence.complete ? "Completed" : "Complete"}
          </Button>
        </>
      }
    >
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {occurrence.title || "Untitled event"}
        </Typography>

        {(isAllDay || recurrenceLabel) && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              mb: 1,
            }}
          >
            {isAllDay && (
              <Pill className="px-2 py-0.5 text-sm">
                All Day
              </Pill>
            )}

            {recurrenceLabel && (
              <Pill className="px-2 py-0.5 text-sm">
                {recurrenceLabel}
              </Pill>
            )}
          </Box>
        )}

        {isAllDay ? (
          <Typography variant="body2" color="text.secondary">
            {allDayRange}
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              <Box component="span" sx={{ color: "text.disabled" }}>
                Starts{" "}
              </Box>
              <Box
                component="span"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                {startDate}
              </Box>
            </Typography>

            <Typography variant="body2" color="text.secondary">
              <Box component="span" sx={{ color: "text.disabled" }}>
                Ends{" "}
              </Box>
              <Box
                component="span"
                sx={{ color: "text.secondary", fontWeight: 600 }}
              >
                {endDate}
              </Box>
            </Typography>
          </>
        )}
      </Box>
    </PopoverCard>
  );
}