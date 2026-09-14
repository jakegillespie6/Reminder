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

  const viewRef = useRef(view);
  const visibleDateRef = useRef(visibleDate);
  const syncTimeoutRef = useRef<number | null>(null);

  viewRef.current = view;
  visibleDateRef.current = visibleDate;

  // Load global calendar settings initially
  useEffect(() => {
    void dispatch(fetchCalendarFilters());
  }, [dispatch]);

  // Sync state from global settings when changed externally (ignoring echo updates)
  useEffect(() => {
    if (!globalCalendarFilters) return;

    if (
      globalCalendarFilters.view &&
      VIEW_MAP_FROM_GLOBAL[globalCalendarFilters.view]
    ) {
      const incomingView = VIEW_MAP_FROM_GLOBAL[globalCalendarFilters.view];
      if (incomingView !== viewRef.current) {
        setView(incomingView);
      }
    }

    if (globalCalendarFilters.start_date) {
      const parsedDate = new Date(globalCalendarFilters.start_date);
      if (
        !isNaN(parsedDate.getTime()) &&
        parsedDate.toDateString() !== visibleDateRef.current.toDateString()
      ) {
        setVisibleDate(parsedDate);
      }
    }
  }, [globalCalendarFilters]);

  // Persist local view/date changes to global settings (batched)
  const syncToGlobalSettings = useCallback(() => {
    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(() => {
      syncTimeoutRef.current = null;
      const nextView = viewRef.current;
      const nextDate = visibleDateRef.current;
      const dateRange = calculateDateRange(nextDate, nextView);

      void dispatch(
        updateCalendarFilters({
          view: VIEW_MAP_TO_GLOBAL[nextView],
          ...dateRange,
        })
      );
    }, 50);
  }, [dispatch]);

  const handleViewChange = useCallback(
    (nextView: CalendarView) => {
      viewRef.current = nextView;
      setView(nextView);
      syncToGlobalSettings();
    },
    [syncToGlobalSettings]
  );

  const handleVisibleDateChange = useCallback(
    (nextDate: Date) => {
      visibleDateRef.current = nextDate;
      setVisibleDate(nextDate);
      syncToGlobalSettings();
    },
    [syncToGlobalSettings]
  );

  // Move the controlled calendar date to today at the next local midnight.
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);

    nextMidnight.setHours(24, 0, 0, 50);

    const timeoutId = window.setTimeout(() => {
      const nextDate = new Date();
      visibleDateRef.current = nextDate;
      setVisibleDate(nextDate);
      syncToGlobalSettings();
    }, nextMidnight.getTime() - now.getTime());

    return () => {
      window.clearTimeout(timeoutId);
      if (syncTimeoutRef.current !== null) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [syncToGlobalSettings]);

  return {
    view,
    visibleDate,
    handleViewChange,
    handleVisibleDateChange,
  };
}