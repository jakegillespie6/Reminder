import api from "@lib/api";

import type {
  CalendarEvent,
  CreateCalendarEventPayload,
  EventOccurrence,
  ListCalendarEventsParams,
  UpdateCalendarEventPayload,
  UpdateOccurrencePayload,
} from "./types";

export const calendarEventsApi = {
  listOccurrences: async (
    params?: ListCalendarEventsParams
  ): Promise<EventOccurrence[]> => {
    const { data } = await api.get<EventOccurrence[]>(
      "/calendar-events/",
      {
        params: {
          ...params,
          expand_recurrence: true,
        },
      }
    );

    return data;
  },

  listBaseEvents: async (
    params?: ListCalendarEventsParams
  ): Promise<CalendarEvent[]> => {
    const { data } = await api.get<CalendarEvent[]>(
      "/calendar-events/",
      {
        params: {
          ...params,
          expand_recurrence: false,
        },
      }
    );

    return data;
  },

  createEvent: async (
    payload: CreateCalendarEventPayload
  ): Promise<CalendarEvent> => {
    const { data } = await api.post<CalendarEvent>(
      "/calendar-events/",
      payload
    );

    return data;
  },

  updateEvent: async (
    id: number,
    payload: UpdateCalendarEventPayload
  ): Promise<CalendarEvent> => {
    const { data } = await api.patch<CalendarEvent>(
      `/calendar-events/${id}/`,
      payload
    );

    return data;
  },

  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/calendar-events/${id}/`);
  },

  updateOccurrence: async (
    id: number,
    payload: UpdateOccurrencePayload
  ): Promise<EventOccurrence> => {
    const { data } = await api.patch<EventOccurrence>(
      `/calendar-events/${id}/occurrence/`,
      payload
    );

    return data;
  },

  deleteOccurrence: async (
    id: number,
    occurrenceDate: string
  ): Promise<void> => {
    await api.delete(`/calendar-events/${id}/occurrence/`, {
      data: {
        occurrence_date: occurrenceDate,
      },
    });
  },
};