import api from "@lib/api";
import type {
  Theme,
  CalendarFilters,
  ItemFilters,
  GlobalSettingKey,
  GlobalSettingResponse,
} from "../types";

const BASE_URL = "/global-settings";

async function getSetting<T>(key: GlobalSettingKey): Promise<GlobalSettingResponse<T>> {
  const { data } = await api.get<GlobalSettingResponse<T>>(`${BASE_URL}/${key}/`);
  return data;
}

async function putSetting<T>(key: GlobalSettingKey, value: T): Promise<GlobalSettingResponse<T>> {
  const { data } = await api.put<GlobalSettingResponse<T>>(`${BASE_URL}/${key}/`, { value });
  return data;
}

export const globalSettingsApi = {
  getTheme: () => getSetting<Theme>("theme"),
  updateTheme: (value: Theme) => putSetting("theme", value),

  getCalendarFilters: () => getSetting<CalendarFilters | null>("calendar_filters"),
  updateCalendarFilters: (value: CalendarFilters | null) =>
    putSetting("calendar_filters", value),

  getItemFilters: () => getSetting<ItemFilters>("item_filters"),
  updateItemFilters: (value: ItemFilters) => putSetting("item_filters", value),
};