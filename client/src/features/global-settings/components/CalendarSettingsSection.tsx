import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Button from "@components/Button";
import ToggleButtonGroup from "@components/ToggleButtonGroup";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { selectCalendar, selectCalendarStatus } from "../store/selectors";
import { fetchCalendarFilters, updateCalendarFilters } from "../store/thunks";
import { CALENDAR_VIEW_OPTIONS, type CalendarFilters, type CalendarView } from "../types";

const toInputDate = (isoStr?: string): string => {
  if (!isoStr) return "";
  return isoStr.slice(0, 10);
};

export default function CalendarSettingsSection() {
  const dispatch = useAppDispatch();
  const calendarFilters = useAppSelector(selectCalendar);
  const status = useAppSelector(selectCalendarStatus);

  const [viewDraft, setViewDraft] = useState<CalendarView>("weekly");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    void dispatch(fetchCalendarFilters());
  }, [dispatch]);

  useEffect(() => {
    if (calendarFilters) {
      if (calendarFilters.view) setViewDraft(calendarFilters.view);
      setStartDate(toInputDate(calendarFilters.start_date));
      setEndDate(toInputDate(calendarFilters.end_date));
    }
  }, [calendarFilters]);

  const saveFilters = async (nextFilters: CalendarFilters | null) => {
    const result = await dispatch(updateCalendarFilters(nextFilters));
    if (!updateCalendarFilters.fulfilled.match(result)) {
      toast.error((result.payload as string) ?? "Calendar filters update failed");
    }
  };

  const onViewChange = (nextView: CalendarView) => {
    if (nextView === viewDraft) return;
    setViewDraft(nextView);

    const payload: CalendarFilters = {
      view: nextView,
      ...(startDate && { start_date: new Date(startDate).toISOString() }),
      ...(endDate && { end_date: new Date(endDate).toISOString() }),
    };
    void saveFilters(payload);
  };

  const onDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);

    if (start && end) {
      const startIso = new Date(`${start}T00:00:00Z`).toISOString();
      const endIso = new Date(`${end}T23:59:59Z`).toISOString();

      void saveFilters({
        view: viewDraft,
        start_date: startIso,
        end_date: endIso,
      });
    }
  };

  const onClearDates = () => {
    setStartDate("");
    setEndDate("");
    void saveFilters({ view: viewDraft });
  };

  return (
    <section className="w-full max-w-md mx-auto p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Calendar View</label>
        <ToggleButtonGroup<CalendarView>
          value={viewDraft}
          onChange={(value) => onViewChange(value)}
          options={CALENDAR_VIEW_OPTIONS}
          disabled={status === "loading"}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Global Window Date Range</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-gray-500 block mb-1">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onDateChange(e.target.value, endDate)}
              disabled={status === "loading"}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <span className="text-xs text-gray-500 block mb-1">End Date</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => onDateChange(startDate, e.target.value)}
              disabled={status === "loading"}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {(startDate || endDate) && (
        <div className="flex justify-end">
          <Button
            label="Clear Date Window"
            variant="secondary"
            onClick={onClearDates}
            disabled={status === "loading"}
          />
        </div>
      )}
    </section>
  );
}