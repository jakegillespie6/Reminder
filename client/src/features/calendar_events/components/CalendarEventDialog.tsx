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
  Radio,
  RadioGroup,
  Select,
  TextField,
} from "@mui/material";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  LocalizationProvider,
} from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

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

  const handleAllDayChange = (allDay: boolean) => {
    onChange.timingType(allDay ? "all_day" : "exact");

    const format = allDay
      ? toLocalDateString
      : toLocalDateTimeString;

    onChange.startDate(format(toDate(startDate)));
    onChange.endDate(format(toDate(endDate)));
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
                <DatePicker
                  label="Start date"
                  value={toDate(startDate)}
                  onChange={(value) =>
                    onChange.startDate(toLocalDateString(value))
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />

                <DatePicker
                  label="End date"
                  value={toDate(endDate)}
                  onChange={(value) =>
                    onChange.endDate(toLocalDateString(value))
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
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