import { useCallback, useEffect } from "react";
import { useCalendarEventsStore } from "./store";
import { ListCalendarEventsParams } from "./types";

export function useCalendarEvents(params?: ListCalendarEventsParams, autoFetch = true) {
  const {
    occurrences,
    events,
    isLoading,
    error,
    fetchOccurrences,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    updateOccurrence,
    deleteOccurrence,
    clearError,
  } = useCalendarEventsStore();

  const reload = useCallback(() => {
    return fetchOccurrences(params);
  }, [fetchOccurrences, params?.start_date, params?.end_date]);

  useEffect(() => {
    if (autoFetch && params?.start_date && params?.end_date) {
      void reload();
    }
  }, [autoFetch, reload, params?.start_date, params?.end_date]);

  return {
    occurrences,
    events,
    isLoading,
    error,
    reload,
    fetchOccurrences,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    updateOccurrence,
    deleteOccurrence,
    clearError,
  };
}