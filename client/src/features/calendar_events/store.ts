import { create } from "zustand";

import { calendarEventsApi } from "./api";

import type {
  CalendarEvent,
  CreateCalendarEventPayload,
  EventOccurrence,
  ListCalendarEventsParams,
  UpdateCalendarEventPayload,
  UpdateOccurrencePayload,
} from "./types";

interface CalendarEventsState {
  occurrences: EventOccurrence[];
  events: CalendarEvent[];

  isLoading: boolean;
  error: string | null;

  fetchOccurrences: (
    params?: ListCalendarEventsParams
  ) => Promise<EventOccurrence[]>;

  fetchEvents: (
    params?: ListCalendarEventsParams
  ) => Promise<CalendarEvent[]>;

  createEvent: (
    payload: CreateCalendarEventPayload
  ) => Promise<CalendarEvent>;

  updateEvent: (
    id: number,
    payload: UpdateCalendarEventPayload
  ) => Promise<CalendarEvent>;

  deleteEvent: (id: number) => Promise<void>;

  updateOccurrence: (
    id: number,
    payload: UpdateOccurrencePayload
  ) => Promise<EventOccurrence>;

  deleteOccurrence: (
    id: number,
    occurrenceDate: string
  ) => Promise<void>;

  clearError: () => void;
}

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export const useCalendarEventsStore =
  create<CalendarEventsState>((set) => ({
    occurrences: [],
    events: [],

    isLoading: false,
    error: null,

    fetchOccurrences: async (params) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const occurrences =
          await calendarEventsApi.listOccurrences(params);

        set({
          occurrences,
          isLoading: false,
        });

        return occurrences;
      } catch (error) {
        set({
          error: getErrorMessage(
            error,
            "Failed to fetch calendar occurrences"
          ),
          isLoading: false,
        });

        throw error;
      }
    },

    fetchEvents: async (params) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const events =
          await calendarEventsApi.listBaseEvents(params);

        set({
          events,
          isLoading: false,
        });

        return events;
      } catch (error) {
        set({
          error: getErrorMessage(
            error,
            "Failed to fetch calendar events"
          ),
          isLoading: false,
        });

        throw error;
      }
    },

    createEvent: async (payload) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const event =
          await calendarEventsApi.createEvent(payload);

        set({
          isLoading: false,
        });

        return event;
      } catch (error) {
        set({
          error: getErrorMessage(
            error,
            "Failed to create calendar event"
          ),
          isLoading: false,
        });

        throw error;
      }
    },

    updateEvent: async (id, payload) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const event =
          await calendarEventsApi.updateEvent(id, payload);

        set((state) => ({
          events: state.events.map((existing) =>
            existing.id === id ? event : existing
          ),
          isLoading: false,
        }));

        return event;
      } catch (error) {
        set({
          error: getErrorMessage(
            error,
            "Failed to update calendar event"
          ),
          isLoading: false,
        });

        throw error;
      }
    },

    deleteEvent: async (id) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        await calendarEventsApi.deleteEvent(id);

        set((state) => ({
          events: state.events.filter(
            (event) => event.id !== id
          ),
          occurrences: state.occurrences.filter(
            (occurrence) => occurrence.event_id !== id
          ),
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: getErrorMessage(
            error,
            "Failed to delete calendar event"
          ),
          isLoading: false,
        });

        throw error;
      }
    },

    updateOccurrence: async (id, payload) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        const occurrence =
          await calendarEventsApi.updateOccurrence(
            id,
            payload
          );

        set({
          isLoading: false,
        });

        return occurrence;
      } catch (error) {
        set({
          error: getErrorMessage(
            error,
            "Failed to update calendar occurrence"
          ),
          isLoading: false,
        });

        throw error;
      }
    },

    deleteOccurrence: async (
      id,
      occurrenceDate
    ) => {
      set({
        isLoading: true,
        error: null,
      });

      try {
        await calendarEventsApi.deleteOccurrence(
          id,
          occurrenceDate
        );

        set((state) => ({
          occurrences: state.occurrences.filter(
            (occurrence) =>
              !(
                occurrence.event_id === id &&
                occurrence.occurrence_date ===
                  occurrenceDate
              )
          ),
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: getErrorMessage(
            error,
            "Failed to delete calendar occurrence"
          ),
          isLoading: false,
        });

        throw error;
      }
    },

    clearError: () => {
      set({
        error: null,
      });
    },
  }));