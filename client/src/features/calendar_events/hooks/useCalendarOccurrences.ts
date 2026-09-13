import { useCallback, useEffect, useMemo } from "react";
import type { SchedulerEvent } from "@mui/x-scheduler/models";
import { useCalendarEventsStore } from "../store";
import { getFetchRange, getOccurrenceId } from "../utils/calendarEventUtils";

export function useCalendarOccurrences(visibleDate: Date) {
  const {
    occurrences,
    fetchOccurrences,
    fetchEvents,
  } = useCalendarEventsStore();

  const reload = useCallback(async () => {
    const { start, end } = getFetchRange(visibleDate);
    const params = {
      start_date: start.toISOString(),
      end_date: end.toISOString(),
    };

    await Promise.all([
      fetchOccurrences(params),
      fetchEvents(params),
    ]);
  }, [visibleDate, fetchOccurrences, fetchEvents]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const schedulerEvents = useMemo<SchedulerEvent[]>(
    () =>
      occurrences.map((occurrence) => ({
        id: getOccurrenceId(occurrence),
        title: occurrence.title || "Untitled",
        start: occurrence.start_date,
        end: occurrence.end_date,
        allDay: occurrence.timing_type === "all_day",
        readOnly: true,
      })),
    [occurrences],
  );

  return {
    occurrences,
    schedulerEvents,
    reload,
  };
}