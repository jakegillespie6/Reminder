import { eventStream } from "@lib/sse/eventStream";
import type { AppDispatch } from "@store/index";
import type { GlobalSettingKey } from "../types";
import { fetchCalendarFilters, fetchItemFilters, fetchTheme } from "./thunks";

type SettingChangedEvent = {
  key: GlobalSettingKey;
  value: unknown;
  previous_value: unknown;
  updated_at: string | null;
};

export function registerGlobalSettingsEvents(dispatch: AppDispatch) {
  const unsubSettingChanged = eventStream.subscribe<SettingChangedEvent>(
    "setting.changed",
    ({ key }) => {
      // Re-fetch only the changed setting to keep Redux in sync
      switch (key) {
        case "theme":
          void dispatch(fetchTheme());
          break;
        case "calendar_filters":
          void dispatch(fetchCalendarFilters());
          break;
        case "item_filters":
          void dispatch(fetchItemFilters());
          break;
      }
    }
  );

  return () => {
    unsubSettingChanged();
  };
}