import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress, Paper } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { EventCalendar } from "@mui/x-scheduler/event-calendar";

import { useCalendarEventsStore } from "../../store";
import { useCalendarOccurrences } from "../../hooks/useCalendarOccurrences";
import { useCalendarGlobalSync } from "../../hooks/useCalendarGlobalSync";
import { CalendarTodaySummary } from "../CalendarEventScheduler/TodaySummary";


export function CalendarDashboard() {
  const { events, isLoading, error, clearError } =
    useCalendarEventsStore();

  const {
    view,
    visibleDate,
    handleViewChange,
    handleVisibleDateChange,
  } = useCalendarGlobalSync();

  const { occurrences, schedulerEvents } =
    useCalendarOccurrences(visibleDate);

  const schedulerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (view !== "day" && view !== "week") {
      return;
    }

    const timeoutIds: number[] = [];
    let animationFrameId: number | undefined;

    const centerCurrentTime = () => {
      const scheduler = schedulerRef.current;
      if (!scheduler) {
        return;
      }

      const indicators = scheduler.querySelectorAll<HTMLElement>(
        [
          '[class*="CurrentTimeIndicator"]',
          '[class*="currentTimeIndicator"]',
          '[class*="current-time-indicator"]',
          '[data-testid*="current-time" i]',
        ].join(","),
      );

      for (const indicator of indicators) {
        let scrollContainer = indicator.parentElement;

        while (scrollContainer && scheduler.contains(scrollContainer)) {
          const { overflowY } = window.getComputedStyle(scrollContainer);
          const canScroll =
            /auto|scroll|overlay/.test(overflowY) &&
            scrollContainer.scrollHeight > scrollContainer.clientHeight + 1;

          if (canScroll) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const indicatorRect = indicator.getBoundingClientRect();

            const targetScrollTop =
              scrollContainer.scrollTop +
              indicatorRect.top -
              containerRect.top -
              scrollContainer.clientHeight / 2 +
              indicatorRect.height / 2;

            scrollContainer.scrollTo({
              top: Math.max(
                0,
                Math.min(
                  targetScrollTop,
                  scrollContainer.scrollHeight -
                    scrollContainer.clientHeight,
                ),
              ),
              behavior: "auto",
            });

            return;
          }

          scrollContainer = scrollContainer.parentElement;
        }
      }
    };

    animationFrameId = window.requestAnimationFrame(centerCurrentTime);

    // Retry while the scheduler finishes laying out its time grid.
    timeoutIds.push(window.setTimeout(centerCurrentTime, 100));
    timeoutIds.push(window.setTimeout(centerCurrentTime, 300));

    return () => {
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
      }

      timeoutIds.forEach(window.clearTimeout);
    };
  }, [view, visibleDate, now]);

  const handleEventEditingStart = useCallback(
    (_event: unknown, details: unknown) => {
      if (
        details &&
        typeof details === "object" &&
        "cancel" in details &&
        typeof details.cancel === "function"
      ) {
        (details.cancel as () => void)();
      }
    },
    [],
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {error && (
          <Alert severity="error" onClose={clearError} sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        {isLoading && (
          <CircularProgress
            size={28}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
            }}
          />
        )}

        <Box
          sx={{
            display: "flex",
            flex: "1 1 0",
            gap: 1.5,
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              width: 312,
              flexShrink: 0,
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              gap: 2,
              overflowY: "auto",
            }}
          >
            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              <DateCalendar
                value={visibleDate}
                onChange={(date) => {
                  if (date) {
                    handleVisibleDateChange(date);
                  }
                }}
              />
            </Paper>

            <CalendarTodaySummary
              occurrences={occurrences}
              now={now}
            />
          </Box>

          <Box
            ref={schedulerRef}
            sx={{ flex: "1 1 0", minWidth: 0, minHeight: 0 }}
          >
            <EventCalendar
              sx={{
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                "& [class*='MuiEventCalendarHeader-root']": {
                  display: "none",
                },
                "& [class*='MuiEventCalendar-headerToolbar']": {
                  display: "none",
                },
                "& [class*='MuiEventCalendar-sidePanel']": {
                  display: "none",
                },
                "& [class*='MuiEventCalendarSidePanel']": {
                  display: "none",
                },
              }}
              view={view}
              views={["day", "week", "month", "agenda"]}
              events={schedulerEvents}
              visibleDate={visibleDate}
              onViewChange={handleViewChange}
              onVisibleDateChange={handleVisibleDateChange}
              onEventEditingStart={handleEventEditingStart}
              eventCreation={false}
            />
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}