import { createAsyncThunk } from "@reduxjs/toolkit";
import type { ItemQueryParams } from "@features/items/types";
import { globalSettingsApi } from "../api";
import type { Theme, CalendarView, ItemFilters, GlobalSettingResponse } from "../types";

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  return "Request failed";
};

export const fetchTheme = createAsyncThunk("globalSettings/fetchTheme", async (_, { rejectWithValue }) => {
  try {
    return await globalSettingsApi.getTheme();
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

export const updateTheme = createAsyncThunk(
  "globalSettings/updateTheme",
  async (value: Theme, { rejectWithValue }) => {
    try {
      return await globalSettingsApi.updateTheme(value);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const fetchCalendar = createAsyncThunk(
  "globalSettings/fetchCalendar",
  async (_, { rejectWithValue }) => {
    try {
      return await globalSettingsApi.getCalendar();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const updateCalendar = createAsyncThunk(
  "globalSettings/updateCalendar",
  async (value: CalendarView, { rejectWithValue }) => {
    try {
      return await globalSettingsApi.updateCalendar(value);
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

export const fetchItemFilters = createAsyncThunk(
  "globalSettings/fetchItemFilters",
  async (_, { rejectWithValue }) => {
    try {
      return await globalSettingsApi.getItemFilters();
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

const toItemFilters = (filters: ItemQueryParams): ItemFilters => ({
  purchased: filters.purchased,
  store: filters.store?.length ? filters.store[0] : undefined,
  type: filters.type?.length ? filters.type[0] : undefined,
  sort: filters.sort,
});

export const updateItemFilters = createAsyncThunk<
  GlobalSettingResponse<ItemFilters>,
  ItemQueryParams,
  { rejectValue: string }
>("globalSettings/updateItemFilters", async (filters, { rejectWithValue }) => {
  try {
    const payload = toItemFilters(filters);
    return await globalSettingsApi.updateItemFilters(payload);
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});