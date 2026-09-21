import { Box } from "@mui/material";
import type { SchedulerEvent } from "@mui/x-scheduler/models";

import type { EventOccurrence } from "../../types";
import type { CalendarView } from "../../utils/schedulerDateUtils";

import { CalendarSchedulerView } from "./view";
import { CalendarTodaySummary } from "./TodaySummary";

interface Props {
  view: CalendarView;
  visibleDate: Date;
  events: SchedulerEvent[];
  occurrences: EventOccurrence[];
  now: number;
  hideControls: boolean;
  onViewChange: (view: CalendarView) => void;
  onVisibleDateChange: (date: Date) => void;
  onEventEditingStart: (event: unknown, details: unknown) => void;
}

export function CalendarSchedulerLayout({
  view,
  visibleDate,
  events,
  occurrences,
  now,
  hideControls,
  onViewChange,
  onVisibleDateChange,
  onEventEditingStart,
}: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flex: "1 1 0",
        width: "100%",
        minWidth: 0,
        minHeight: 0,
        gap: 1.5,
      }}
    >


      {/* Main scheduler */}
      <Box
        sx={{
          flex: "1 1 0",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <CalendarSchedulerView
          view={view}
          visibleDate={visibleDate}
          events={events}
          hideControls={hideControls}
          onViewChange={onViewChange}
          onVisibleDateChange={onVisibleDateChange}
          onEventEditingStart={onEventEditingStart}
        />
      </Box>
    </Box>
  );
}