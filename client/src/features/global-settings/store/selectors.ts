import type { RootState } from "@store/index";

export const selectGlobalSettingsState = (state: RootState) => state.globalSettings;

export const selectTheme = (state: RootState) => state.globalSettings.theme;
export const selectCalendar = (state: RootState) => state.globalSettings.calendar;
export const selectItemFilters = (state: RootState) => state.globalSettings.itemFilters;

export const selectGlobalSettingsError = (state: RootState) => state.globalSettings.error;

export const selectThemeStatus = (state: RootState) => state.globalSettings.status.theme;
export const selectCalendarStatus = (state: RootState) => state.globalSettings.status.calendar;
export const selectItemFiltersStatus = (state: RootState) => state.globalSettings.status.itemFilters;