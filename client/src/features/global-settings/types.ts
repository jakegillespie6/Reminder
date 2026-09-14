import type { Store, SortOption } from "@features/items/types";

export type Theme = "light" | "dark" | "abyssal";
export type CalendarView = "daily" | "weekly" | "monthly" | "agenda";

export interface CalendarFilters {
  start_date?: string;
  end_date?: string;
  view?: CalendarView;
}

export const CALENDAR_VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "agenda", label: "Agenda" },
];

// Use the same shape as items store/query filters
export type ItemFilters = {
  purchased?: boolean;
  store?: Store;      // changed from Store[]
  sort?: SortOption;
};

export type GlobalSettingKey = "theme" | "calendar_filters" | "item_filters";

export interface GlobalSettingResponse<T> {
  key: GlobalSettingKey;
  value: T;
  updated_at: string | null;
}

export type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export interface GlobalSettingsState {
  theme: Theme | null;
  calendarFilters: CalendarFilters | null;
  itemFilters: ItemFilters;
  updatedAt: {
    theme: string | null;
    calendarFilters: string | null;
    itemFilters: string | null;
  };
  status: {
    theme: "idle" | "loading" | "succeeded" | "failed";
    calendarFilters: "idle" | "loading" | "succeeded" | "failed";
    itemFilters: "idle" | "loading" | "succeeded" | "failed";
  };
  error: string | null;
}