import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Popover,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  LocalizationProvider,
} from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { useState } from "react";

import type {
  RecurrenceFreq,
  TimingType,
  Weekday,
} from "../types";
import { RecurrenceFields } from "./RecurrenceFields";

type EndMode = "duration" | "custom";

interface CalendarEventDialogProps {
  open: boolean;
  isEditing: boolean;
  editMode: "occurrence" | "series";
  title: string;
  startDate: string;
  endDate: string;
  timingType: TimingType;
  recurrence: RecurrenceFreq;
  recurrenceInterval: number;
  recurrenceDaysOfWeek: Weekday[];
  complete: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onChange: {
    title: (value: string) => void;
    startDate: (value: string) => void;
    endDate: (value: string) => void;
    timingType: (value: TimingType) => void;
    recurrence: (value: RecurrenceFreq) => void;
    recurrenceInterval: (value: number) => void;
    recurrenceDaysOfWeek: (value: Weekday[]) => void;
    complete: (value: boolean) => void;
    editMode: (value: "occurrence" | "series") => void;
    endMode: (value: EndMode) => void;
    durationMinutes: (value: number) => void;
  };
  endMode: EndMode;
  durationMinutes: number;
}

export function CalendarEventDialog({
  open,
  isEditing,
  editMode,
  title,
  startDate,
  endDate,
  timingType,
  recurrence,
  recurrenceInterval,
  recurrenceDaysOfWeek,
  complete,
  onClose,
  onSave,
  onDelete,
  onChange,
  endMode,
  durationMinutes,
}: CalendarEventDialogProps) {
  const toDate = (value: string): Date | null => {
    if (!value) return null;

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (dateOnly) {
      return new Date(
        Number(dateOnly[1]),
        Number(dateOnly[2]) - 1,
        Number(dateOnly[3])
      );
    }

    return new Date(value);
  };

  const toLocalDateString = (value: Date | null): string =>
    !value
      ? ""
      : `${value.getFullYear()}-${String(
          value.getMonth() + 1
        ).padStart(2, "0")}-${String(value.getDate()).padStart(
          2,
          "0"
        )}`;

  const toLocalDateTimeString = (value: Date | null): string =>
    !value
      ? ""
      : [
          toLocalDateString(value),
          `${String(value.getHours()).padStart(2, "0")}:${String(
            value.getMinutes()
          ).padStart(2, "0")}`,
        ].join("T");

  const isBeforeDateOnly = (
    value: Date | null,
    minimum: Date | null
  ): boolean => {
    if (!value || !minimum) return false;

    const valueDate = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    );

    const minimumDate = new Date(
      minimum.getFullYear(),
      minimum.getMonth(),
      minimum.getDate()
    );

    return valueDate < minimumDate;
  };

  const handleAllDayChange = (allDay: boolean) => {
    onChange.timingType(allDay ? "all_day" : "exact");

    if (allDay) {
      const nextStart = toDate(startDate);
      const nextEnd = toDate(endDate);
      const nextStartDate = toLocalDateString(nextStart);

      onChange.startDate(nextStartDate);
      onChange.endDate(
        isBeforeDateOnly(nextEnd, nextStart)
          ? nextStartDate
          : toLocalDateString(nextEnd)
      );

      return;
    }

    onChange.startDate(toLocalDateTimeString(toDate(startDate)));
    onChange.endDate(toLocalDateTimeString(toDate(endDate)));
  };

  const [rangeAnchor, setRangeAnchor] = useState<HTMLElement | null>(null);
  const [pendingRangeStart, setPendingRangeStart] = useState<Date | null>(
    null
  );

  const closeRangePicker = () => {
    setRangeAnchor(null);
    setPendingRangeStart(null);
  };

  const handleRangeDateChange = (value: Date | null) => {
    if (!value) return;

    if (!pendingRangeStart) {
      setPendingRangeStart(value);
      return;
    }

    const [start, end] =
      value < pendingRangeStart
        ? [value, pendingRangeStart]
        : [pendingRangeStart, value];

    onChange.startDate(toLocalDateString(start));
    onChange.endDate(toLocalDateString(end));
    closeRangePicker();
  };

  const formatDateDisplay = (value: string): string => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    return match ? `${match[2]}/${match[3]}/${match[1]}` : "";
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEditing ? "Edit Calendar Event" : "Create Calendar Event"}
      </DialogTitle>

      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pt: 1,
            }}
          >
            <TextField
              label="Title"
              value={title}
              onChange={(event) =>
                onChange.title(event.target.value)
              }
              fullWidth
              required
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={timingType === "all_day"}
                  onChange={(event) =>
                    handleAllDayChange(event.target.checked)
                  }
                />
              }
              label="All day"
            />

            {timingType === "all_day" ? (
              <>
                <TextField
                  label="Date range"
                  value={
                    startDate && endDate
                      ? `${formatDateDisplay(startDate)} - ${formatDateDisplay(
                          endDate
                        )}`
                      : ""
                  }
                  fullWidth
                  required
                  onClick={(event) => {
                    setPendingRangeStart(null);
                    setRangeAnchor(event.currentTarget);
                  }}
                  slotProps={{
                    htmlInput: {
                      readOnly: true,
                    },
                  }}
                />

                <Popover
                  open={Boolean(rangeAnchor)}
                  anchorEl={rangeAnchor}
                  onClose={closeRangePicker}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                >
                  <Box sx={{ p: 1 }}>
                    <Typography sx={{ px: 2, pt: 1 }} variant="body2">
                      {pendingRangeStart
                        ? "Select the end date"
                        : "Select the start date"}
                    </Typography>

                    <DateCalendar
                      value={pendingRangeStart ?? toDate(startDate)}
                      onChange={handleRangeDateChange}
                    />
                  </Box>
                </Popover>
              </>
            ) : (
              <>
                <DateTimePicker
                  label="Start"
                  value={toDate(startDate)}
                  onChange={(value) =>
                    onChange.startDate(
                      toLocalDateTimeString(value)
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />

                {endMode === "duration" ? (
                  <FormControl fullWidth>
                    <InputLabel id="duration-label">
                      Duration
                    </InputLabel>
                    <Select
                      labelId="duration-label"
                      label="Duration"
                      value={durationMinutes}
                      onChange={(event) =>
                        onChange.durationMinutes(
                          Number(event.target.value)
                        )
                      }
                    >
                      <MenuItem value={5}>5 minutes</MenuItem>
                      <MenuItem value={15}>15 minutes</MenuItem>
                      <MenuItem value={30}>30 minutes</MenuItem>
                      <MenuItem value={60}>60 minutes</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <DateTimePicker
                    label="End"
                    value={toDate(endDate)}
                    onChange={(value) =>
                      onChange.endDate(
                        toLocalDateTimeString(value)
                      )
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                      },
                    }}
                  />
                )}

                <Button
                  variant="text"
                  onClick={() =>
                    onChange.endMode(
                      endMode === "duration"
                        ? "custom"
                        : "duration"
                    )
                  }
                  sx={{
                    alignSelf: "flex-start",
                    p: 0,
                    minWidth: 0,
                    textTransform: "none",
                  }}
                >
                  {endMode === "duration"
                    ? "Custom End Date"
                    : "Duration"}
                </Button>
              </>
            )}

            <RecurrenceFields
              recurrence={recurrence}
              recurrenceInterval={recurrenceInterval}
              recurrenceDaysOfWeek={recurrenceDaysOfWeek}
              onRecurrenceChange={onChange.recurrence}
              onIntervalChange={onChange.recurrenceInterval}
              onDaysChange={onChange.recurrenceDaysOfWeek}
            />

            {isEditing && recurrence !== "none" && (
              <FormControl>
                <RadioGroup
                  value={editMode}
                  onChange={(event) =>
                    onChange.editMode(
                      event.target.value as
                        | "occurrence"
                        | "series"
                    )
                  }
                >
                  <FormControlLabel
                    value="occurrence"
                    control={<Radio />}
                    label="This occurrence only"
                  />
                  <FormControlLabel
                    value="series"
                    control={<Radio />}
                    label="Entire series"
                  />
                </RadioGroup>
              </FormControl>
            )}

        
            <Popover
              open={Boolean(rangeAnchor)}
              anchorEl={rangeAnchor}
              onClose={closeRangePicker}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
            >
              <Box sx={{ p: 1 }}>
                <Typography sx={{ px: 2, pt: 1 }} variant="body2">
                  {pendingRangeStart
                    ? "Select the end date"
                    : "Select the start date"}
                </Typography>

                <DateCalendar
                  value={pendingRangeStart ?? toDate(startDate)}
                  onChange={handleRangeDateChange}
                />
              </Box>
            </Popover>
          </Box>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions>
        {isEditing && (
          <Button color="error" onClick={onDelete}>
            Delete
          </Button>
        )}

        <Box sx={{ ml: "auto" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={onSave}>
            Save
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}