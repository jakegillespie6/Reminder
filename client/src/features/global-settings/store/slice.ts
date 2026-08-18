import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { GlobalSettingsState } from "../types";
import {
  fetchTheme,
  updateTheme,
  fetchCalendar,
  updateCalendar,
  fetchItemFilters,
  updateItemFilters,
} from "./thunks";

const initialState: GlobalSettingsState = {
  theme: null,
  calendar: null,
  itemFilters: {},
  updatedAt: {
    theme: null,
    calendar: null,
    itemFilters: null,
  },
  status: {
    theme: "idle",
    calendar: "idle",
    itemFilters: "idle",
  },
  error: null,
};

const globalSettingsSlice = createSlice({
  name: "globalSettings",
  initialState,
  reducers: {
    clearGlobalSettingsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Theme
      .addCase(fetchTheme.pending, (state) => {
        state.status.theme = "loading";
        state.error = null;
      })
      .addCase(fetchTheme.fulfilled, (state, action) => {
        state.status.theme = "succeeded";
        state.theme = action.payload.value;
        state.updatedAt.theme = action.payload.updated_at;
      })
      .addCase(fetchTheme.rejected, (state, action) => {
        state.status.theme = "failed";
        state.error = (action.payload as string) ?? action.error.message ?? "Failed to fetch theme";
      })
      .addCase(updateTheme.pending, (state) => {
        state.status.theme = "loading";
        state.error = null;
      })
      .addCase(updateTheme.fulfilled, (state, action) => {
        state.status.theme = "succeeded";
        state.theme = action.payload.value;
        state.updatedAt.theme = action.payload.updated_at;
      })
      .addCase(updateTheme.rejected, (state, action) => {
        state.status.theme = "failed";
        state.error = (action.payload as string) ?? action.error.message ?? "Failed to update theme";
      })

      // Calendar
      .addCase(fetchCalendar.pending, (state) => {
        state.status.calendar = "loading";
        state.error = null;
      })
      .addCase(fetchCalendar.fulfilled, (state, action) => {
        state.status.calendar = "succeeded";
        state.calendar = action.payload.value;
        state.updatedAt.calendar = action.payload.updated_at;
      })
      .addCase(fetchCalendar.rejected, (state, action) => {
        state.status.calendar = "failed";
        state.error = (action.payload as string) ?? action.error.message ?? "Failed to fetch calendar";
      })
      .addCase(updateCalendar.pending, (state) => {
        state.status.calendar = "loading";
        state.error = null;
      })
      .addCase(updateCalendar.fulfilled, (state, action) => {
        state.status.calendar = "succeeded";
        state.calendar = action.payload.value;
        state.updatedAt.calendar = action.payload.updated_at;
      })
      .addCase(updateCalendar.rejected, (state, action) => {
        state.status.calendar = "failed";
        state.error = (action.payload as string) ?? action.error.message ?? "Failed to update calendar";
      })

      // Item filters
      .addCase(fetchItemFilters.pending, (state) => {
        state.status.itemFilters = "loading";
        state.error = null;
      })
      .addCase(fetchItemFilters.fulfilled, (state, action) => {
        state.status.itemFilters = "succeeded";
        state.itemFilters = action.payload.value;
        state.updatedAt.itemFilters = action.payload.updated_at;
      })
      .addCase(fetchItemFilters.rejected, (state, action) => {
        state.status.itemFilters = "failed";
        state.error = (action.payload as string) ?? action.error.message ?? "Failed to fetch item filters";
      })
      .addCase(updateItemFilters.pending, (state) => {
        state.status.itemFilters = "loading";
        state.error = null;
      })
      .addCase(updateItemFilters.fulfilled, (state, action) => {
        state.status.itemFilters = "succeeded";
        state.itemFilters = action.payload.value;
        state.updatedAt.itemFilters = action.payload.updated_at;
      })
      .addCase(updateItemFilters.rejected, (state, action) => {
        state.status.itemFilters = "failed";
        state.error = (action.payload as string) ?? action.error.message ?? "Failed to update item filters";
      });
  },
});

export const { clearGlobalSettingsError } = globalSettingsSlice.actions;
export default globalSettingsSlice.reducer;