export type TimingType = "exact" | "all_day";

export type RecurrenceFreq =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export type CalendarEventSource =
  | "internal"
  | "google"
  | "apple";

export interface CalendarEvent {
  id: number;

  title: string;

  start_date: string;
  end_date: string;

  timing_type: TimingType;

  duration_seconds: number;
  is_multi_day: boolean;

  complete: boolean;

  recurrence: RecurrenceFreq;
  recurrence_interval: number;

  recurrence_days_of_week: Weekday[];
  recurrence_days_of_month: number[];
  recurrence_months_of_year: number[];
  recurrence_set_positions: number[];

  timezone: string;

  source: CalendarEventSource;

  external_id: string;
  external_local_id: string;
  external_calendar_id: string;
}

export interface EventOccurrence {
  event_id: number;

  /**
   * Original generated occurrence start.
   *
   * Important: this does not change when an occurrence is moved.
   * Django uses this to identify the exception.
   */
  occurrence_date: string;

  title: string;

  start_date: string;
  end_date: string;

  duration_seconds: number;
  is_multi_day: boolean;

  complete: boolean;

  timing_type: TimingType;
  recurrence: RecurrenceFreq;

  is_exception: boolean;
}

export interface CreateCalendarEventPayload {
  title: string;

  start_date: string;
  end_date: string;

  timing_type?: TimingType;
  complete?: boolean;

  recurrence?: RecurrenceFreq;
  recurrence_interval?: number;

  recurrence_end?: string | null;
  recurrence_count?: number | null;

  recurrence_days_of_week?: Weekday[];
  recurrence_days_of_month?: number[];
  recurrence_months_of_year?: number[];
  recurrence_set_positions?: number[];

  timezone?: string;
}

export type UpdateCalendarEventPayload =
  Partial<CreateCalendarEventPayload>;

export interface UpdateOccurrencePayload {
  occurrence_date: string;

  title?: string | null;

  start_date?: string | null;
  end_date?: string | null;

  complete?: boolean | null;

  timing_type?: TimingType | null;
}

export interface ListCalendarEventsParams {
  start_date?: string;
  end_date?: string;
}

export type Weekday =
  | "MO"
  | "TU"
  | "WE"
  | "TH"
  | "FR"
  | "SA"
  | "SU";