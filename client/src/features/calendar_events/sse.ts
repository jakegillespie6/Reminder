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

const refetch = () => {
  void useCalendarEventsStore.getState().refetchWithActiveFilters();
};

export function registerCalendarEvents() {
  const unsubCreated = eventStream.subscribe<CalendarEvent>(
    "calendar_event.created",
    () => {
      refetch();
      toast.success("Event created");
    }
  );

  const unsubUpdated = eventStream.subscribe<CalendarEvent>(
    "calendar_event.updated",
    (event) => {
      refetch();
      toast.success(event.complete ? "Event completed" : "Event updated");
    }
  );

  const unsubDeleted = eventStream.subscribe<{ id: number }>(
    "calendar_event.deleted",
    () => {
      refetch();
      toast.success("Event deleted");
    }
  );

  const unsubOccurrenceUpdated = eventStream.subscribe<EventOccurrence>(
    "calendar_event.occurrence_updated",
    (occurrence) => {
      refetch();
      toast.success(
        occurrence.complete ? "Occurrence completed" : "Occurrence updated"
      );
    }
  );

  const unsubOccurrenceDeleted = eventStream.subscribe<{
    event_id: number;
    occurrence_date: string;
  }>("calendar_event.occurrence_deleted", () => {
    refetch();
    toast.success("Occurrence deleted");
  });

  const unsubSettingChanged = eventStream.subscribe<SettingChangedPayload>(
    "setting.changed",
    ({ key, value }) => {
      if (key !== "calendar_filters") return;

      const store = useCalendarEventsStore.getState();
      const nextFilters = normalizeCalendarFilters(value);

      if (areCalendarFiltersEqual(store.filters, nextFilters)) return;

      store.setFilters(nextFilters);
      refetch();
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