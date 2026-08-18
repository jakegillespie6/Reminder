import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import { fetchCalendar, updateCalendar } from "../store/thunks";
import { selectCalendar, selectCalendarStatus } from "../store/selectors";
import { CALENDAR_VIEW_OPTIONS, type CalendarView } from "../types";
import ToggleButtonGroup from "@components/ToggleButtonGroup";
const CALENDAR_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function CalendarSettingsSection() {
  const dispatch = useAppDispatch();
  const calendar = useAppSelector(selectCalendar);
  const status = useAppSelector(selectCalendarStatus);

  const [calendarDraft, setCalendarDraft] = useState<CalendarView>("weekly");

  useEffect(() => {
    void dispatch(fetchCalendar());
  }, [dispatch]);

  useEffect(() => {
    if (calendar) setCalendarDraft(calendar);
  }, [calendar]);

  const onCalendarChange = async (nextView: CalendarView) => {
    if (nextView === calendarDraft) return;

    const previous = calendarDraft;
    setCalendarDraft(nextView); // optimistic UI update

    const result = await dispatch(updateCalendar(nextView));

    if (!updateCalendar.fulfilled.match(result)) {
      setCalendarDraft(previous); // revert on failure
      toast.error((result.payload as string) ?? "Calendar update failed");
    }
  };

  return (
    <section className="w-full p-4">
      <div className="w-full max-w-[400px] mx-auto">
        <ToggleButtonGroup<CalendarView>
          value={calendarDraft}
          onChange={(value) => void onCalendarChange(value)}
          options={CALENDAR_VIEW_OPTIONS}
          disabled={status === "loading"}
          className="w-full"
        />
      </div>
    </section>
  );
}