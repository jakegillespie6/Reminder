import toast from "react-hot-toast";

import { eventStream } from "@lib/sse/eventStream";
import { useCalendarEventsStore } from "./store";
import {
  areCalendarFiltersEqual,
  normalizeCalendarFilters,
} from "./range";

import type { CalendarEvent, EventOccurrence } from "./types";

type SettingChangedPayload = {
  key: string;
  value: unknown;
  previous_value: unknown;
  updated_at: string | null;
};

/**
 * Recurring events cannot be expanded client-side, so any change to a
 * recurring event triggers a range refetch. Single events are patched
 * into local state directly.
 */
const applyEventChange = (event: CalendarEvent, message: string) => {
  const store = useCalendarEventsStore.getState();

  if (event.recurrence !== "none") {
    void store.refetchWithActiveFilters();
    toast.success(message);
    return;
  }

  const startMs = new Date(event.start_date).getTime();
  const endMs = new Date(event.end_date).getTime();

  const durationSeconds =
    event.duration_seconds ?? Math.max(0, Math.round((endMs - startMs) / 1000));

  const isMultiDay =
    event.is_multi_day ??
    event.start_date.slice(0, 10) !== event.end_date.slice(0, 10);

  const occurrence: EventOccurrence = {
    event_id: event.id,
    occurrence_date: event.start_date,
    title: event.title,
    start_date: event.start_date,
    end_date: event.end_date,
    duration_seconds: durationSeconds,
    is_multi_day: isMultiDay,
    complete: event.complete,
    timing_type: event.timing_type,
    recurrence: event.recurrence,
    is_exception: false,
  };

  store.upsertIncomingOccurrences([occurrence]);
  toast.success(message);
};

export function registerCalendarEvents() {
  const unsubCreated = eventStream.subscribe<CalendarEvent>(
    "calendar_event.created",
    (event) => applyEventChange(event, "Event created")
  );

  const unsubUpdated = eventStream.subscribe<CalendarEvent>(
    "calendar_event.updated",
    (event) => applyEventChange(event, "Event updated")
  );

  const unsubDeleted = eventStream.subscribe<{ id: number }>(
    "calendar_event.deleted",
    ({ id }) => {
      useCalendarEventsStore.getState().removeIncomingEvent(id);
      toast.success("Event deleted");
    }
  );

  const unsubOccurrenceUpdated = eventStream.subscribe<EventOccurrence>(
    "calendar_event.occurrence.updated",
    (occurrence) => {
      useCalendarEventsStore
        .getState()
        .upsertIncomingOccurrences([occurrence]);
      toast.success("Event occurrence updated");
    }
  );

  const unsubOccurrenceDeleted = eventStream.subscribe<{
    event_id: number;
    occurrence_date: string;
  }>("calendar_event.occurrence.deleted", ({ event_id, occurrence_date }) => {
    useCalendarEventsStore
      .getState()
      .removeIncomingOccurrence(event_id, occurrence_date);
    toast.success("Event occurrence deleted");
  });

  const unsubSettingChanged = eventStream.subscribe<SettingChangedPayload>(
    "setting.changed",
    ({ key, value }) => {
      if (key !== "calendar_filters") return;

      const store = useCalendarEventsStore.getState();
      const nextFilters = normalizeCalendarFilters(value);

      if (areCalendarFiltersEqual(store.filters, nextFilters)) return;

      store.setFilters(nextFilters);
      void useCalendarEventsStore.getState().refetchWithActiveFilters();
      toast.success("Calendar settings updated");
    }
  );

  return () => {
    unsubCreated();
    unsubUpdated();
    unsubDeleted();
    unsubOccurrenceUpdated();
    unsubOccurrenceDeleted();
    unsubSettingChanged();
  };
}