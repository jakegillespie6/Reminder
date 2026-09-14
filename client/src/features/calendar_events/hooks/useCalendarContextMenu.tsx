import { useCallback, useMemo, useState } from "react";
import { FiCheck, FiEdit2, FiTrash2 } from "react-icons/fi";
import type { PopoverMenuItem } from "@components/PopoverMenu";
import type { CalendarEvent, EventOccurrence } from "../types";
import { getOccurrenceId } from "../utils/calendarEventUtils";
import { getEventMenuPoint, type EventMenuPoint } from "../utils/schedulerDateUtils";

interface UseCalendarContextMenuParams {
  occurrences: EventOccurrence[];
  events: CalendarEvent[];
  reload: () => Promise<void>;
  updateOccurrence: (
    eventId: number,
    payload: any,
  ) => Promise<any>;
  updateEvent: (
    eventId: number,
    payload: any,
  ) => Promise<any>;
  deleteOccurrence: (
    eventId: number,
    occurrenceDate: string,
  ) => Promise<any>;
  deleteEvent: (eventId: number) => Promise<any>;
  openEditDialog: (occurrence: EventOccurrence) => void;
}

export function useCalendarContextMenu({
  occurrences,
  events,
  reload,
  updateOccurrence,
  updateEvent,
  deleteOccurrence,
  deleteEvent,
  openEditDialog,
}: UseCalendarContextMenuParams) {
  const [eventMenuOpen, setEventMenuOpen] = useState(false);
  const [eventMenuPoint, setEventMenuPoint] = useState<EventMenuPoint | null>(null);
  const [eventMenuOccurrence, setEventMenuOccurrence] = useState<EventOccurrence | null>(null);

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

  const openEventMenu = useCallback(
    (schedulerOccurrence: any, eventDetails: any) => {
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

      const occurrence = occurrenceMap.get(occurrenceId);
      if (!occurrence) return;

      setEventMenuOccurrence(occurrence);
      setEventMenuPoint(getEventMenuPoint(eventDetails));
      setEventMenuOpen(true);
    },
    [occurrenceMap],
  );

  const handleToggleEventComplete = useCallback(async () => {
    if (!eventMenuOccurrence) return;

    const complete = !eventMenuOccurrence.complete;
    try {
      closeEventMenu();

      if (eventMenuOccurrence.recurrence !== "none") {
        await updateOccurrence(eventMenuOccurrence.event_id, {
          occurrence_date: eventMenuOccurrence.occurrence_date,
          title: eventMenuOccurrence.title,
          start_date: eventMenuOccurrence.start_date,
          end_date: eventMenuOccurrence.end_date,
          timing_type: eventMenuOccurrence.timing_type,
          complete,
        });
      } else {
        const baseEvent = events.find(
          (event) => event.id === eventMenuOccurrence.event_id,
        );
        if (!baseEvent) return;

        await updateEvent(eventMenuOccurrence.event_id, {
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
      // Store handles errors
    }
  }, [
    closeEventMenu,
    eventMenuOccurrence,
    events,
    reload,
    updateEvent,
    updateOccurrence,
  ]);

  const eventMenuItems = useMemo<PopoverMenuItem[]>(() => {
    if (!eventMenuOccurrence) return [];

    const isSeries = eventMenuOccurrence.recurrence !== "none";

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
  }, [
    closeEventMenu,
    deleteEvent,
    deleteOccurrence,
    eventMenuOccurrence,
    handleToggleEventComplete,
    openEditDialog,
    reload,
  ]);

  return {
    eventMenuOpen,
    setEventMenuOpen,
    eventMenuPoint,
    eventMenuOccurrence,
    closeEventMenu,
    openEventMenu,
    eventMenuItems,
  };
}