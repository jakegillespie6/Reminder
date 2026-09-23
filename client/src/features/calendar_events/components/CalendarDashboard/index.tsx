import { useCallback, useEffect, useRef, useState } from "react";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { EventCalendar } from "@mui/x-scheduler/event-calendar";

import { useCalendarEventsStore } from "../../store";
import { useCalendarOccurrences } from "../../hooks/useCalendarOccurrences";
import { useCalendarGlobalSync } from "../../hooks/useCalendarGlobalSync";
import { CalendarTodaySummary } from "../CalendarEventScheduler/TodaySummary";

export function CalendarDashboard() {
  const { isLoading, error, clearError } = useCalendarEventsStore();

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
    if (view !== "day" && view !== "week") return;

    const timeoutIds: number[] = [];
    let animationFrameId: number | undefined;

    const centerCurrentTime = () => {
      const scheduler = schedulerRef.current;
      if (!scheduler) return;

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
            const containerRect =
              scrollContainer.getBoundingClientRect();
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
      <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden">
        {error && (
          <div
            role="alert"
            className="mb-2 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={clearError}
              className="ml-3 font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading && (
          <div className="absolute right-4 top-4 z-10 h-7 w-7 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        )}

        <div className="flex min-h-0 min-w-0 flex-1 gap-3">
          <aside className="hidden w-[312px] shrink-0 flex-col gap-4 overflow-y-auto md:flex">
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <DateCalendar
                value={visibleDate}
                onChange={(date) => {
                  if (date) {
                    handleVisibleDateChange(date);
                  }
                }}
              />
            </div>

            <CalendarTodaySummary
              occurrences={occurrences}
              now={now}
            />
          </aside>

          <div
            ref={schedulerRef}
            className="min-h-0 min-w-0 flex-1"
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

    // Event name first, time second
    "& .MuiEventCalendar-eventItemTitle": {
      order: 1,
    },
    "& .MuiEventCalendar-eventItemTime": {
      order: 2,
    },

    // Day/week time-grid events
    "& .MuiEventCalendar-timeGridEventTitle": {
      order: 1,
    },
    "& .MuiEventCalendar-timeGridEventTime": {
      order: 2,
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
          </div>
        </div>
      </div>
    </LocalizationProvider>
  );
}