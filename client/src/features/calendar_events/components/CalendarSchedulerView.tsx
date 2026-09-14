import { EventCalendar } from "@mui/x-scheduler/event-calendar";
import type { CalendarView } from "../utils/schedulerDateUtils";
import type { SchedulerEvent } from "@mui/x-scheduler/models";

interface Props {
  view: CalendarView;
  visibleDate: Date;
  events: SchedulerEvent[];
  hideControls: boolean;
  onViewChange: (view: CalendarView) => void;
  onVisibleDateChange: (date: Date) => void;
  onEventEditingStart: (event: unknown, details: unknown) => void;
}

export function CalendarSchedulerView({
  view,
  visibleDate,
  events,
  hideControls,
  onViewChange,
  onVisibleDateChange,
  onEventEditingStart,
}: Props) {
  return (
    <EventCalendar
      sx={{
        flex: "1 1 0",
        minHeight: 0,
        ...(hideControls && {
          "& [class*='MuiEventCalendarHeader-root']": {
            display: "none",
          },
          "& [class*='MuiEventCalendar-headerToolbarLabel']": {
            display: "none",
          },
          "& button[aria-expanded], & button[aria-label*='sidebar' i], & button[aria-label*='side panel' i]":
            {
              display: "none",
            },
          "& .MuiEventCalendar-headerToolbarTodayButton": {
            display: "none",
          },
          "& button[aria-label*='previous' i], & button[aria-label*='next' i]":
            {
              display: "none",
            },
        }),
      }}
      view={view}
      views={["day", "week", "month", "agenda"]}
      events={events}
      visibleDate={visibleDate}
      onViewChange={onViewChange}
      onVisibleDateChange={onVisibleDateChange}
      onEventEditingStart={onEventEditingStart}
      eventCreation={false}
    />
  );
}