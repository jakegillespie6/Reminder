import { useCallback, useState } from "react";
import { EventCalendar } from "@mui/x-scheduler/event-calendar";
import { Alert, Box, CircularProgress } from "@mui/material";
import { FiPlus } from "react-icons/fi";

import { useCalendarEventsStore } from "../store";
import type { CreateCalendarEventPayload, EventOccurrence } from "../types";
import { CalendarEventDialog } from "./CalendarEventDialog";
import { CalendarEventContextMenu } from "./CalendarEventContextMenu";
import { useCalendarOccurrences } from "../hooks/useCalendarOccurrences";
import { useCalendarEventForm } from "../hooks/useCalendarEventForm";
import { useCalendarGlobalSync } from "../hooks/useCalendarGlobalSync";
import { useCalendarContextMenu } from "../hooks/useCalendarContextMenu";
import {
  toDatetimeLocal,
  toPayloadDate,
} from "../utils/calendarEventUtils";
import FloatingActionButton from "@components/FloatingActionButton";

interface CalendarEventsSchedulerProps {
  /** Renders the calendar without creation, editing, or context menus. */
  readOnly?: boolean;
  /** Hides the scheduler toolbar and mini-calendar collapse control. */
  hideControls?: boolean;
}

export function CalendarEventsScheduler({
  readOnly = false,
  hideControls = false,
}: CalendarEventsSchedulerProps) {
  const {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    updateOccurrence,
    deleteOccurrence,
    clearError,
  } = useCalendarEventsStore();

  const {
    view,
    visibleDate,
    handleViewChange,
    handleVisibleDateChange,
  } = useCalendarGlobalSync();

  const [openDialog, setOpenDialog] = useState(false);

  const { occurrences, schedulerEvents, reload } =
    useCalendarOccurrences(visibleDate);

  const form = useCalendarEventForm();

  const openCreateDialog = useCallback(() => {
    form.resetForm();

    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    form.setStartDate(toDatetimeLocal(start));
    form.setEndDate(toDatetimeLocal(end));
    setOpenDialog(true);
  }, [form]);

  const openEditDialog = useCallback(
    (occurrence: EventOccurrence) => {
      const baseEvent = events.find(
        (event) => event.id === occurrence.event_id,
      );
      if (!baseEvent) return;

      form.setSelectedOccurrence(occurrence);
      form.setTitle(baseEvent.title);
      form.setStartDate(toDatetimeLocal(baseEvent.start_date));

      form.setEndDate(toDatetimeLocal(baseEvent.end_date));

      form.setTimingType(baseEvent.timing_type);
      form.setRecurrence(baseEvent.recurrence);
      form.setRecurrenceInterval(baseEvent.recurrence_interval ?? 1);
      form.setRecurrenceDaysOfWeek(baseEvent.recurrence_days_of_week ?? []);
      form.setComplete(baseEvent.complete);
      form.setEditMode(
        baseEvent.recurrence === "none" ? "series" : "occurrence",
      );
      form.setEndMode("custom");
      form.setDurationMinutes(
        Math.max(
          5,
          Math.round(
            (new Date(baseEvent.end_date).getTime() -
              new Date(baseEvent.start_date).getTime()) /
              60000,
          ),
        ),
      );

      setOpenDialog(true);
    },
    [events, form],
  );

  const {
    eventMenuOpen,
    setEventMenuOpen,
    eventMenuPoint,
    eventMenuOccurrence,
    closeEventMenu,
    openEventMenu,
    eventMenuItems,
  } = useCalendarContextMenu({
    occurrences,
    events,
    reload,
    updateOccurrence,
    updateEvent,
    deleteOccurrence,
    deleteEvent,
    openEditDialog,
  });

  const handleEventEditingStart = useCallback(
    (schedulerOccurrence: any, eventDetails: any) => {
      eventDetails?.cancel?.();

      if (readOnly || eventDetails?.reason === "creation") {
        return;
      }

      openEventMenu(schedulerOccurrence, eventDetails);
    },
    [openEventMenu, readOnly],
  );

  const updateEndFromDuration = useCallback(
    (startValue: string, minutes: number) => {
      if (!startValue) return;
      const end = new Date(startValue);
      end.setMinutes(end.getMinutes() + minutes);
      form.setEndDate(toDatetimeLocal(end));
    },
    [form],
  );

  const handleSave = useCallback(async () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) {
      return;
    }

    const payloadStart = toPayloadDate(
      form.startDate,
      form.timingType,
    );
    const payloadEnd = toPayloadDate(
      form.endDate,
      form.timingType,
    );

    try {
      if (!form.selectedOccurrence) {
        const payload: CreateCalendarEventPayload = {
          title: form.title.trim(),
          start_date: payloadStart,
          end_date: payloadEnd,
          timing_type: form.timingType,
          complete: form.complete,
          recurrence: form.recurrence,
          recurrence_interval:
            form.recurrence === "none" ? 1 : form.recurrenceInterval,
          recurrence_days_of_week:
            form.recurrence === "weekly" ? form.recurrenceDaysOfWeek : [],
          timezone: "America/Los_Angeles",
        };

        await createEvent(payload);
      } else if (
        form.editMode === "occurrence" &&
        form.selectedOccurrence.recurrence !== "none"
      ) {
        await updateOccurrence(form.selectedOccurrence.event_id, {
          occurrence_date: form.selectedOccurrence.occurrence_date,
          title: form.title.trim(),
          start_date: payloadStart,
          end_date: payloadEnd,
          timing_type: form.timingType,
          complete: form.complete,
        });
      } else {
        await updateEvent(form.selectedOccurrence.event_id, {
          title: form.title.trim(),
          start_date: payloadStart,
          end_date: payloadEnd,
          timing_type: form.timingType,
          complete: form.complete,
          recurrence: form.recurrence,
          recurrence_interval:
            form.recurrence === "none" ? 1 : form.recurrenceInterval,
          recurrence_days_of_week:
            form.recurrence === "weekly" ? form.recurrenceDaysOfWeek : [],
          timezone: "America/Los_Angeles",
        });
      }

      setOpenDialog(false);
      await reload();
    } catch {
      // Handled by store
    }
  }, [createEvent, form, reload, updateEvent, updateOccurrence]);

  const handleDelete = useCallback(async () => {
    if (!form.selectedOccurrence) return;

    try {
      if (
        form.editMode === "occurrence" &&
        form.selectedOccurrence.recurrence !== "none"
      ) {
        await deleteOccurrence(
          form.selectedOccurrence.event_id,
          form.selectedOccurrence.occurrence_date,
        );
      } else {
        await deleteEvent(form.selectedOccurrence.event_id);
      }

      setOpenDialog(false);
      await reload();
    } catch {
      // Handled by store
    }
  }, [deleteEvent, deleteOccurrence, form, reload]);

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        width: "100%",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
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

    <EventCalendar
      sx={{
        flex: "1 1 0",
        minHeight: 0,

        "& [class*='MuiEventCalendar-headerToolbarLabel']": {
          display: "none",
        },

        ...(hideControls && {
          "& [class*='MuiEventCalendarHeader-root']": {
            display: "none",
          },
          "& button[aria-expanded], & button[aria-label*='sidebar' i], & button[aria-label*='side panel' i]":
            {
              display: "none",
            },
          "& .MuiEventCalendar-headerToolbarTodayButton": {
            display: "none",
          },
          // Hide previous / next navigation buttons
          "& button[aria-label*='previous' i], & button[aria-label*='next' i]": {
            display: "none",
          },

          // Hide Today button
          "& button": {
            "&:has(span)": {
              // leave this out if unsupported in your browser
            },
          },
        }),
      }}
        view={view}
        onViewChange={handleViewChange}
        views={["day", "week", "month", "agenda"]}
        events={schedulerEvents}
        visibleDate={visibleDate}
        onVisibleDateChange={handleVisibleDateChange}
        onEventEditingStart={handleEventEditingStart}
        eventCreation={false}
      />

      {!readOnly && (
        <>
          <FloatingActionButton
            icon={<FiPlus aria-hidden="true" />}
            label="Create Event"
            onClick={() => {
              closeEventMenu();
              openCreateDialog();
            }}
            position="bottom-right"
          />

          <CalendarEventContextMenu
            open={eventMenuOpen}
            occurrence={eventMenuOccurrence}
            anchorPoint={eventMenuPoint}
            items={eventMenuItems}
            onOpenChange={(open) => {
              if (open) {
                setEventMenuOpen(true);
              } else {
                closeEventMenu();
              }
            }}
          />

          <CalendarEventDialog
            open={openDialog}
            isEditing={Boolean(form.selectedOccurrence)}
            editMode={form.editMode}
            title={form.title}
            startDate={form.startDate}
            endDate={form.endDate}
            timingType={form.timingType}
            recurrence={form.recurrence}
            recurrenceInterval={form.recurrenceInterval}
            recurrenceDaysOfWeek={form.recurrenceDaysOfWeek}
            complete={form.complete}
            endMode={form.endMode}
            durationMinutes={form.durationMinutes}
            onClose={() => setOpenDialog(false)}
            onSave={handleSave}
            onDelete={handleDelete}
            onChange={{
              title: form.setTitle,
              endDate: form.setEndDate,
              timingType: form.setTimingType,
              recurrence: form.setRecurrence,
              recurrenceInterval: form.setRecurrenceInterval,
              recurrenceDaysOfWeek: form.setRecurrenceDaysOfWeek,
              complete: form.setComplete,
              editMode: form.setEditMode,
              endMode: (mode) => {
                form.setEndMode(mode);
                if (mode === "duration") {
                  updateEndFromDuration(form.startDate, form.durationMinutes);
                }
              },
              durationMinutes: (minutes) => {
                form.setDurationMinutes(minutes);
                if (form.endMode === "duration") {
                  updateEndFromDuration(form.startDate, minutes);
                }
              },
              startDate: (value) => {
                form.setStartDate(value);
                if (form.endMode === "duration") {
                  updateEndFromDuration(value, form.durationMinutes);
                }
              },
            }}
          />
        </>
      )}
    </Box>
  );
}