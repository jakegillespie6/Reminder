import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import type {
  RecurrenceFreq,
  Weekday,
} from "../types";
import { WEEKDAYS } from "../utils/calendarEventUtils";

interface RecurrenceFieldsProps {
  recurrence: RecurrenceFreq;
  recurrenceInterval: number;
  recurrenceDaysOfWeek: Weekday[];
  onRecurrenceChange: (value: RecurrenceFreq) => void;
  onIntervalChange: (value: number) => void;
  onDaysChange: (value: Weekday[]) => void;
}

export function RecurrenceFields({
  recurrence,
  recurrenceInterval,
  recurrenceDaysOfWeek,
  onRecurrenceChange,
  onIntervalChange,
  onDaysChange,
}: RecurrenceFieldsProps) {
  return (
    <>
      <FormControl fullWidth>
        <InputLabel id="recurrence-label">
          Recurrence
        </InputLabel>

        <Select
          labelId="recurrence-label"
          label="Recurrence"
          value={recurrence}
          onChange={(event) =>
            onRecurrenceChange(
              event.target.value as RecurrenceFreq
            )
          }
        >
          <MenuItem value="none">None</MenuItem>
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
          <MenuItem value="yearly">Yearly</MenuItem>
        </Select>
      </FormControl>

      {recurrence === "weekly" && (
        <FormControl>
          <FormLabel>Days of the week</FormLabel>

          <FormGroup row>
            {WEEKDAYS.map((day) => (
              <FormControlLabel
                key={day.value}
                label={day.label}
                control={
                  <Checkbox
                    checked={recurrenceDaysOfWeek.includes(
                      day.value
                    )}
                    onChange={(event) => {
                      onDaysChange(
                        event.target.checked
                          ? [
                              ...recurrenceDaysOfWeek,
                              day.value,
                            ]
                          : recurrenceDaysOfWeek.filter(
                              (value) =>
                                value !== day.value
                            )
                      );
                    }}
                  />
                }
              />
            ))}
          </FormGroup>
        </FormControl>
      )}

      <TextField
        label="Repeat Interval"
        type="number"
        value={recurrenceInterval}
        onChange={(event) =>
          onIntervalChange(
            Math.max(1, Number(event.target.value))
          )
        }
        slotProps={{
          htmlInput: { min: 1 },
        }}
        fullWidth
      />
    </>
  );
}