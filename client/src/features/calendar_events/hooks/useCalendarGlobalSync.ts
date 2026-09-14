import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  fetchCalendarFilters,
  updateCalendarFilters,
} from "@features/global-settings/store/thunks";
import { selectCalendar } from "@features/global-settings/store/selectors";
import {
  type CalendarView,
  calculateDateRange,
  VIEW_MAP_FROM_GLOBAL,
  VIEW_MAP_TO_GLOBAL,
} from "../utils/schedulerDateUtils";

export function useCalendarGlobalSync() {
  const dispatch = useAppDispatch();
  const globalCalendarFilters = useAppSelector(selectCalendar);

  const [view, setView] = useState<CalendarView>("week");
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const isInitialSync = useRef(true);

  // Load global calendar settings initially
  useEffect(() => {
    void dispatch(fetchCalendarFilters());
  }, [dispatch]);

  // Sync state from global settings when changed externally
  useEffect(() => {
    if (!globalCalendarFilters) return;

    if (
      globalCalendarFilters.view &&
      VIEW_MAP_FROM_GLOBAL[globalCalendarFilters.view]
    ) {
      const localView = VIEW_MAP_FROM_GLOBAL[globalCalendarFilters.view];
      setView(localView);
    }

    if (globalCalendarFilters.start_date) {
      const parsedDate = new Date(globalCalendarFilters.start_date);
      if (!isNaN(parsedDate.getTime())) {
        setVisibleDate(parsedDate);
      }
    }
  }, [globalCalendarFilters]);

  // Persist local view/date changes to global settings
  const syncToGlobalSettings = useCallback(
    (nextView: CalendarView, nextDate: Date) => {
      const dateRange = calculateDateRange(nextDate, nextView);
      void dispatch(
        updateCalendarFilters({
          view: VIEW_MAP_TO_GLOBAL[nextView],
          ...dateRange,
        })
      );
    },
    [dispatch]
  );

  const handleViewChange = useCallback(
    (nextView: CalendarView) => {
      setView(nextView);
      syncToGlobalSettings(nextView, visibleDate);
    },
    [syncToGlobalSettings, visibleDate]
  );

  const handleVisibleDateChange = useCallback(
    (nextDate: Date) => {
      setVisibleDate(nextDate);
      if (isInitialSync.current) {
        isInitialSync.current = false;
        return;
      }
      syncToGlobalSettings(view, nextDate);
    },
    [syncToGlobalSettings, view]
  );

  return {
    view,
    visibleDate,
    handleViewChange,
    handleVisibleDateChange,
  };
}