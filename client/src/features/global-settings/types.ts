import type { Store, ItemType, SortOption } from "@features/items/types";

export type Theme = "dark" | "light" | "abyssal";
export type CalendarView = "monthly" | "weekly" | "daily";

export const CALENDAR_VIEW_OPTIONS: ReadonlyArray<{
  value: CalendarView;
  label: string;
}> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// Use the same shape as items store/query filters
export type ItemFilters = {
  purchased?: boolean;
  store?: Store;      // changed from Store[]
  type?: ItemType;    // changed from ItemType[]
  sort?: SortOption;
};

export type GlobalSettingKey = "theme" | "calendar" | "item_filters";

export interface GlobalSettingResponse<T> {
  key: GlobalSettingKey;
  value: T;
  updated_at: string;
}

export type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export interface GlobalSettingsState {
  theme: Theme | null;
  calendar: CalendarView | null;
  itemFilters: ItemFilters;
  updatedAt: {
    theme: string | null;
    calendar: string | null;
    itemFilters: string | null;
  };
  status: {
    theme: AsyncStatus;
    calendar: AsyncStatus;
    itemFilters: AsyncStatus;
  };
  error: string | null;
}