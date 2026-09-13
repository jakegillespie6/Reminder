import {
  useCallback,
  useMemo,
  useState,
} from "react";

import { EventCalendar } from "@mui/x-scheduler/event-calendar";

import {
  Alert,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  FiCheck,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

import { useCalendarEventsStore } from "../store";

import type {
  CreateCalendarEventPayload,
  EventOccurrence,
} from "../types";

import { CalendarEventDialog } from "./CalendarEventDialog";
import { CalendarEventContextMenu } from "./CalendarEventContextMenu";

import { useCalendarOccurrences } from "../hooks/useCalendarOccurrences";
import { useCalendarEventForm } from "../hooks/useCalendarEventForm";

import {
  getOccurrenceId,
  toDatetimeLocal,
} from "../utils/calendarEventUtils";

import CollapsibleSection from "@components/CollapsibleSection";
import ToggleButtonGroup, {
  type ToggleOption,
} from "@components/ToggleButtonGroup";
import type { PopoverMenuItem } from "@components/PopoverMenu";

type CalendarView = "day" | "week" | "month" | "agenda";

const VIEW_OPTIONS: ReadonlyArray<ToggleOption<CalendarView>> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "agenda", label: "Agenda" },
];

type EventMenuPoint = {
  x: number;
  y: number;
};

function getEventMenuPoint(
  eventDetails: any,
): EventMenuPoint {
  const source =
    eventDetails?.event ??
    eventDetails?.nativeEvent ??
    eventDetails?.domEvent ??
    eventDetails?.originalEvent;

  if (
    typeof source?.clientX === "number" &&
    typeof source?.clientY === "number"
  ) {
    return {
      x: source.clientX,
      y: source.clientY,
    };
  }

  const element =
    eventDetails?.element ??
    eventDetails?.eventElement ??
    source?.currentTarget ??
    source?.target;

  if (element instanceof HTMLElement) {
    const rect = element.getBoundingClientRect();

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}

export function CalendarEventsScheduler() {
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

  const [view, setView] =
    useState<CalendarView>("week");

  const [visibleDate, setVisibleDate] =
    useState(() => new Date());

  const [openDialog, setOpenDialog] =
    useState(false);

  const [eventMenuOpen, setEventMenuOpen] =
    useState(false);

  const [eventMenuPoint, setEventMenuPoint] =
    useState<EventMenuPoint | null>(null);

  const [eventMenuOccurrence, setEventMenuOccurrence] =
    useState<EventOccurrence | null>(null);

  const {
    occurrences,
    schedulerEvents,
    reload,
  } = useCalendarOccurrences(visibleDate);

  const form = useCalendarEventForm();

  const occurrenceMap = useMemo(
    () =>
      new Map(
        occurrences.map((occurrence) => [
          getOccurrenceId(occurrence),
          occurrence,
        ]),
      ),
    [occurrences],
  );

  const closeEventMenu = useCallback(() => {
    setEventMenuOpen(false);
    setEventMenuOccurrence(null);
    setEventMenuPoint(null);
  }, []);

  const openCreateDialog = useCallback(() => {
    closeEventMenu();
    form.resetForm();

    const start = new Date();
    const end = new Date(
      start.getTime() + 60 * 60 * 1000,
    );

    form.setStartDate(toDatetimeLocal(start));
    form.setEndDate(toDatetimeLocal(end));
    setOpenDialog(true);
  }, [closeEventMenu, form]);

  const openEditDialog = useCallback(
    (occurrence: EventOccurrence) => {
      closeEventMenu();

      const baseEvent = events.find(
        (event) => event.id === occurrence.event_id,
      );

      if (!baseEvent) {
        return;
      }

      form.setSelectedOccurrence(occurrence);
      form.setTitle(baseEvent.title);
      form.setStartDate(
        toDatetimeLocal(baseEvent.start_date),
      );
      form.setEndDate(
        toDatetimeLocal(baseEvent.end_date),
      );
      form.setTimingType(baseEvent.timing_type);
      form.setRecurrence(baseEvent.recurrence);
      form.setRecurrenceInterval(
        baseEvent.recurrence_interval ?? 1,
      );
      form.setRecurrenceDaysOfWeek(
        baseEvent.recurrence_days_of_week ?? [],
      );
      form.setComplete(baseEvent.complete);
      form.setEditMode(
        baseEvent.recurrence === "none"
          ? "series"
          : "occurrence",
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
    [closeEventMenu, events, form],
  );

  const handleSave = useCallback(async () => {
    if (
      !form.title.trim() ||
      !form.startDate ||
      !form.endDate
    ) {
      return;
    }

    const payloadStart = new Date(
      form.startDate,
    ).toISOString();

    const payloadEnd = new Date(
      form.endDate,
    ).toISOString();

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
            form.recurrence === "none"
              ? 1
              : form.recurrenceInterval,
          recurrence_days_of_week:
            form.recurrence === "weekly"
              ? form.recurrenceDaysOfWeek
              : [],
          timezone: "America/Los_Angeles",
        };

        await createEvent(payload);
      } else if (
        form.editMode === "occurrence" &&
        form.selectedOccurrence.recurrence !== "none"
      ) {
        await updateOccurrence(
          form.selectedOccurrence.event_id,
          {
            occurrence_date:
              form.selectedOccurrence.occurrence_date,
            title: form.title.trim(),
            start_date: payloadStart,
            end_date: payloadEnd,
            timing_type: form.timingType,
            complete: form.complete,
          },
        );
      } else {
        await updateEvent(
          form.selectedOccurrence.event_id,
          {
            title: form.title.trim(),
            start_date: payloadStart,
            end_date: payloadEnd,
            timing_type: form.timingType,
            complete: form.complete,
            recurrence: form.recurrence,
            recurrence_interval:
              form.recurrence === "none"
                ? 1
                : form.recurrenceInterval,
            recurrence_days_of_week:
              form.recurrence === "weekly"
                ? form.recurrenceDaysOfWeek
                : [],
            timezone: "America/Los_Angeles",
          },
        );
      }

      setOpenDialog(false);
      await reload();
    } catch {
      // The store handles errors.
    }
  }, [
    createEvent,
    form,
    reload,
    updateEvent,
    updateOccurrence,
  ]);

  const handleDelete = useCallback(async () => {
    if (!form.selectedOccurrence) {
      return;
    }

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
        await deleteEvent(
          form.selectedOccurrence.event_id,
        );
      }

      setOpenDialog(false);
      await reload();
    } catch {
      // The store handles errors.
    }
  }, [
    deleteEvent,
    deleteOccurrence,
    form,
    reload,
  ]);

  const openEventMenu = useCallback(
    (
      schedulerOccurrence: any,
      eventDetails: any,
    ) => {
      eventDetails?.cancel?.();
      eventDetails?.event?.preventDefault?.();
      eventDetails?.event?.stopPropagation?.();
      eventDetails?.nativeEvent?.preventDefault?.();
      eventDetails?.nativeEvent?.stopPropagation?.();

      const occurrenceId = String(
        eventDetails?.occurrence?.id ??
          eventDetails?.eventOccurrence?.id ??
          eventDetails?.event?.id ??
          schedulerOccurrence?.id ??
          "",
      );

      const occurrence = occurrenceMap.get(
        occurrenceId,
      );

      if (!occurrence) {
        return;
      }

      setEventMenuOccurrence(occurrence);
      setEventMenuPoint(
        getEventMenuPoint(eventDetails),
      );
      setEventMenuOpen(true);
    },
    [occurrenceMap],
  );

  const handleEventEditingStart = useCallback(
    (
      schedulerOccurrence: any,
      eventDetails: any,
    ) => {
      eventDetails.cancel();

      if (eventDetails.reason === "creation") {
        openCreateDialog();
        return;
      }

      openEventMenu(
        schedulerOccurrence,
        eventDetails,
      );
    },
    [openCreateDialog, openEventMenu],
  );

  const updateEndFromDuration = useCallback(
    (startValue: string, minutes: number) => {
      if (!startValue) {
        return;
      }

      const end = new Date(startValue);
      end.setMinutes(end.getMinutes() + minutes);
      form.setEndDate(toDatetimeLocal(end));
    },
    [form],
  );

  const handleMarkEventComplete = useCallback(
    async () => {
      const occurrence = eventMenuOccurrence;

      if (!occurrence) {
        return;
      }

      const complete = !occurrence.complete;

      try {
        closeEventMenu();

        if (occurrence.recurrence !== "none") {
          await updateOccurrence(occurrence.event_id, {
            occurrence_date: occurrence.occurrence_date,
            title: occurrence.title,
            start_date: occurrence.start_date,
            end_date: occurrence.end_date,
            timing_type: occurrence.timing_type,
            complete,
          });
        } else {
          const baseEvent = events.find(
            (event) => event.id === occurrence.event_id,
          );

          if (!baseEvent) {
            return;
          }

          await updateEvent(occurrence.event_id, {
            title: baseEvent.title,
            start_date: baseEvent.start_date,
            end_date: baseEvent.end_date,
            timing_type: baseEvent.timing_type,
            complete,
            recurrence: baseEvent.recurrence,
            recurrence_interval:
              baseEvent.recurrence === "none"
                ? 1
                : baseEvent.recurrence_interval ?? 1,
            recurrence_days_of_week:
              baseEvent.recurrence === "weekly"
                ? baseEvent.recurrence_days_of_week ?? []
                : [],
            timezone: "America/Los_Angeles",
          });
        }

        await reload();
      } catch {
        // The store handles errors.
      }
    },
    [
      closeEventMenu,
      eventMenuOccurrence,
      events,
      reload,
      updateEvent,
      updateOccurrence,
    ],
  );

  const handleToggleEventComplete = useCallback(
    async () => {
      const occurrence = eventMenuOccurrence;

      if (!occurrence) {
        return;
      }

      const complete = !occurrence.complete;

      try {
        closeEventMenu();

        if (occurrence.recurrence !== "none") {
          await updateOccurrence(occurrence.event_id, {
            occurrence_date: occurrence.occurrence_date,
            title: occurrence.title,
            start_date: occurrence.start_date,
            end_date: occurrence.end_date,
            timing_type: occurrence.timing_type,
            complete,
          });
        } else {
          const baseEvent = events.find(
            (event) => event.id === occurrence.event_id,
          );

          if (!baseEvent) {
            return;
          }

          await updateEvent(occurrence.event_id, {
            title: baseEvent.title,
            start_date: baseEvent.start_date,
            end_date: baseEvent.end_date,
            timing_type: baseEvent.timing_type,
            complete,
            recurrence: baseEvent.recurrence,
            recurrence_interval:
              baseEvent.recurrence === "none"
                ? 1
                : baseEvent.recurrence_interval ?? 1,
            recurrence_days_of_week:
              baseEvent.recurrence === "weekly"
                ? baseEvent.recurrence_days_of_week ?? []
                : [],
            timezone: "America/Los_Angeles",
          });
        }

        await reload();
      } catch {
        // The store handles errors.
      }
    },
    [
      closeEventMenu,
      eventMenuOccurrence,
      events,
      reload,
      updateEvent,
      updateOccurrence,
    ],
  );

  const eventMenuItems = useMemo<PopoverMenuItem[]>(
    () => {
      if (!eventMenuOccurrence) {
        return [];
      }

      const isSeries =
        eventMenuOccurrence.recurrence !== "none";

      const items: PopoverMenuItem[] = [
        {
          label: eventMenuOccurrence.complete
            ? "Unmark as complete"
            : "Mark as complete",
          icon: <FiCheck aria-hidden="true" />,
          onClick: () => void handleToggleEventComplete(),
        },
        {
          label: "Edit event",
          icon: <FiEdit2 aria-hidden="true" />,
          onClick: () => openEditDialog(eventMenuOccurrence),
        },
      ];

      if (isSeries) {
        items.push(
          {
            label: "Delete occurrence",
            icon: <FiTrash2 aria-hidden="true" />,
            danger: true,
            onClick: async () => {
              closeEventMenu();
              await deleteOccurrence(
                eventMenuOccurrence.event_id,
                eventMenuOccurrence.occurrence_date,
              );
              await reload();
            },
          },
          {
            label: "Delete series",
            icon: <FiTrash2 aria-hidden="true" />,
            danger: true,
            onClick: async () => {
              closeEventMenu();
              await deleteEvent(eventMenuOccurrence.event_id);
              await reload();
            },
          },
        );
      } else {
        items.push({
          label: "Delete event",
          icon: <FiTrash2 aria-hidden="true" />,
          danger: true,
          onClick: async () => {
            closeEventMenu();
            await deleteEvent(eventMenuOccurrence.event_id);
            await reload();
          },
        });
      }

      return items;
    },
    [
      closeEventMenu,
      deleteEvent,
      deleteOccurrence,
      eventMenuOccurrence,
      handleMarkEventComplete,
      handleToggleEventComplete,
      openEditDialog,
      reload,
    ],
  );

  return (
    <Box
      sx={{
        height: "85vh",
        width: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <section className="relative z-[2500]">
        <CollapsibleSection title="Calendar Settings" defaultOpen={false}>
          <div className="w-full max-w-sm pt-1">
            <ToggleButtonGroup
              label="Calendar View"
              value={view}
              options={VIEW_OPTIONS}
              onChange={setView}
            />
          </div>
        </CollapsibleSection>
      </section>

      {error && (
        <Alert
          severity="error"
          onClose={clearError}
          sx={{ mb: 2 }}
        >
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
        view={view}
        onViewChange={setView}
        views={["day", "week", "month", "agenda"]}
        events={schedulerEvents}
        visibleDate={visibleDate}
        onVisibleDateChange={setVisibleDate}
        onEventEditingStart={
          handleEventEditingStart
        }
        eventCreation={{
          duration: 60,
          interaction: "click",
        }}
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
        recurrenceDaysOfWeek={
          form.recurrenceDaysOfWeek
        }
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
          recurrenceInterval:
            form.setRecurrenceInterval,
          recurrenceDaysOfWeek:
            form.setRecurrenceDaysOfWeek,
          complete: form.setComplete,
          editMode: form.setEditMode,
          endMode: (mode) => {
            form.setEndMode(mode);

            if (mode === "duration") {
              updateEndFromDuration(
                form.startDate,
                form.durationMinutes,
              );
            }
          },
          durationMinutes: (minutes) => {
            form.setDurationMinutes(minutes);

            if (form.endMode === "duration") {
              updateEndFromDuration(
                form.startDate,
                minutes,
              );
            }
          },
          startDate: (value) => {
            form.setStartDate(value);

            if (form.endMode === "duration") {
              updateEndFromDuration(
                value,
                form.durationMinutes,
              );
            }
          },
        }}
      />
    </Box>
  );
}