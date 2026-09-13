import { useCallback, useState } from "react";
import type {
  EventOccurrence,
  RecurrenceFreq,
  TimingType,
  Weekday,
} from "../types";
import { toDatetimeLocal } from "../utils/calendarEventUtils";

export function useCalendarEventForm() {
  const [selectedOccurrence, setSelectedOccurrence] =
    useState<EventOccurrence | null>(null);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timingType, setTimingType] =
    useState<TimingType>("exact");
  const [recurrence, setRecurrence] =
    useState<RecurrenceFreq>("none");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] =
    useState<Weekday[]>([]);
  const [complete, setComplete] = useState(false);
  const [editMode, setEditMode] =
    useState<"occurrence" | "series">("occurrence");
  const [endMode, setEndMode] =
    useState<"duration" | "custom">("duration");
  const [durationMinutes, setDurationMinutes] = useState(30);

  const resetForm = useCallback(() => {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    setSelectedOccurrence(null);
    setTitle("");
    setStartDate(toDatetimeLocal(start));
    setEndDate(toDatetimeLocal(end));
    setTimingType("exact");
    setRecurrence("none");
    setRecurrenceInterval(1);
    setRecurrenceDaysOfWeek([]);
    setComplete(false);
    setEditMode("occurrence");
    setEndMode("duration");
    setDurationMinutes(30);
  }, []);

  const openForCreate = useCallback(() => {
    resetForm();
  }, [resetForm]);

  return {
    selectedOccurrence,
    setSelectedOccurrence,
    title,
    setTitle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    timingType,
    setTimingType,
    recurrence,
    setRecurrence,
    recurrenceInterval,
    setRecurrenceInterval,
    recurrenceDaysOfWeek,
    setRecurrenceDaysOfWeek,
    complete,
    setComplete,
    editMode,
    setEditMode,
    endMode,
    setEndMode,
    durationMinutes,
    setDurationMinutes,
    resetForm,
    openForCreate,
  };
}