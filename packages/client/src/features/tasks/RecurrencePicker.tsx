import React from 'react';
import { RecurrenceFrequency, type RecurrenceRule, formatRecurrenceLabel } from '@self/contracts';
import { RotateCw, X, CalendarDays, Clock } from 'lucide-react';
import { parseLocalDate } from '../../lib/date-context';

export interface RecurrencePickerProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
  currentDate?: string;
}

const WEEKDAYS = [
  { id: 1, short: 'M', full: 'Monday' },
  { id: 2, short: 'T', full: 'Tuesday' },
  { id: 3, short: 'W', full: 'Wednesday' },
  { id: 4, short: 'T', full: 'Thursday' },
  { id: 5, short: 'F', full: 'Friday' },
  { id: 6, short: 'S', full: 'Saturday' },
  { id: 0, short: 'S', full: 'Sunday' },
];

const MONTHS = [
  { id: 1, name: 'January', maxDays: 31 },
  { id: 2, name: 'February', maxDays: 29 },
  { id: 3, name: 'March', maxDays: 31 },
  { id: 4, name: 'April', maxDays: 30 },
  { id: 5, name: 'May', maxDays: 31 },
  { id: 6, name: 'June', maxDays: 30 },
  { id: 7, name: 'July', maxDays: 31 },
  { id: 8, name: 'August', maxDays: 31 },
  { id: 9, name: 'September', maxDays: 30 },
  { id: 10, name: 'October', maxDays: 31 },
  { id: 11, name: 'November', maxDays: 30 },
  { id: 12, name: 'December', maxDays: 31 },
];

export function RecurrencePicker({ value, onChange, currentDate }: RecurrencePickerProps) {
  const getContextDateDefaults = () => {
    if (!currentDate) return { weekday: 1, day: 1, month: 1 };
    const d = parseLocalDate(currentDate);
    return {
      weekday: d.getDay(), // 0 = Sun, 1 = Mon ... 6 = Sat
      day: d.getDate(),
      month: d.getMonth() + 1,
    };
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const freq = e.target.value;
    if (freq === 'none') {
      onChange(null);
      return;
    }

    const { weekday, day, month } = getContextDateDefaults();
    const startDate = value?.startDate ?? currentDate;
    const endDate = value?.endDate ?? undefined;

    switch (freq) {
      case RecurrenceFrequency.DAILY:
        onChange({
          frequency: RecurrenceFrequency.DAILY,
          interval: value?.frequency === RecurrenceFrequency.DAILY ? (value.interval ?? 1) : 1,
          startDate,
          endDate,
        });
        break;
      case RecurrenceFrequency.WEEKLY:
        onChange({
          frequency: RecurrenceFrequency.WEEKLY,
          interval: 1,
          daysOfWeek:
            value?.frequency === RecurrenceFrequency.WEEKLY && value.daysOfWeek?.length
              ? value.daysOfWeek
              : [weekday],
          startDate,
          endDate,
        });
        break;
      case RecurrenceFrequency.MONTHLY:
        onChange({
          frequency: RecurrenceFrequency.MONTHLY,
          interval: 1,
          daysOfMonth:
            value?.frequency === RecurrenceFrequency.MONTHLY && value.daysOfMonth?.length
              ? value.daysOfMonth
              : [day],
          startDate,
          endDate,
        });
        break;
      case RecurrenceFrequency.YEARLY:
        onChange({
          frequency: RecurrenceFrequency.YEARLY,
          interval: 1,
          yearlyDate: {
            month,
            day,
          },
          startDate,
          endDate,
        });
        break;
    }
  };

  const handleToggleWeekday = (dayId: number) => {
    if (!value || value.frequency !== RecurrenceFrequency.WEEKLY) return;
    const currentDays = value.daysOfWeek ?? [];
    let updated: number[];
    if (currentDays.includes(dayId)) {
      updated = currentDays.filter((d) => d !== dayId);
    } else {
      updated = [...currentDays, dayId].sort((a, b) => a - b);
    }
    onChange({
      ...value,
      daysOfWeek: updated,
    });
  };

  const handleToggleMonthDay = (dayNum: number) => {
    if (!value || value.frequency !== RecurrenceFrequency.MONTHLY) return;
    const currentDays = value.daysOfMonth ?? [];
    let updated: number[];
    if (currentDays.includes(dayNum)) {
      updated = currentDays.filter((d) => d !== dayNum);
    } else {
      updated = [...currentDays, dayNum].sort((a, b) => a - b);
    }
    onChange({
      ...value,
      daysOfMonth: updated,
    });
  };

  const handleDailyIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const interval = Number.isNaN(val) || val < 1 ? 1 : Math.min(val, 365);
    if (!value || value.frequency !== RecurrenceFrequency.DAILY) return;
    onChange({
      ...value,
      interval,
    });
  };

  const handleYearlyMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(e.target.value, 10);
    if (!value || value.frequency !== RecurrenceFrequency.YEARLY) return;
    const maxDays = MONTHS.find((m) => m.id === month)?.maxDays ?? 31;
    const curDay = value.yearlyDate?.day ?? 1;
    const clampedDay = Math.min(curDay, maxDays);
    onChange({
      ...value,
      yearlyDate: {
        month,
        day: clampedDay,
      },
    });
  };

  const handleYearlyDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const day = parseInt(e.target.value, 10);
    if (!value || value.frequency !== RecurrenceFrequency.YEARLY) return;
    onChange({
      ...value,
      yearlyDate: {
        month: value.yearlyDate?.month ?? 1,
        day,
      },
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!value) return;
    onChange({
      ...value,
      startDate: e.target.value || undefined,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!value) return;
    onChange({
      ...value,
      endDate: e.target.value || null,
    });
  };

  const selectedMonth =
    value?.frequency === RecurrenceFrequency.YEARLY ? (value.yearlyDate?.month ?? 1) : 1;
  const maxYearlyDays = MONTHS.find((m) => m.id === selectedMonth)?.maxDays ?? 31;

  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/30 p-2.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="recurrence-frequency-select"
          className="text-2xs font-medium text-muted-foreground flex items-center gap-1.5"
        >
          <RotateCw className="w-3.5 h-3.5 text-primary" />
          <span>Repeat Frequency:</span>
        </label>

        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-2xs text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer"
            title="Remove recurrence"
          >
            <X className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <select
          id="recurrence-frequency-select"
          value={value ? value.frequency : 'none'}
          onChange={handleFrequencyChange}
          className="px-2.5 py-1.5 sm:py-1 text-base sm:text-xs rounded border border-border bg-card text-foreground shadow-2xs focus:ring-1 focus:ring-primary focus:outline-hidden"
        >
          <option value="none">Does not repeat</option>
          <option value={RecurrenceFrequency.DAILY}>Daily</option>
          <option value={RecurrenceFrequency.WEEKLY}>Weekly</option>
          <option value={RecurrenceFrequency.MONTHLY}>Monthly</option>
          <option value={RecurrenceFrequency.YEARLY}>Yearly</option>
        </select>

        {value && (
          <span
            data-testid="recurrence-preview-badge"
            className="text-2xs text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 truncate max-w-xs"
          >
            {formatRecurrenceLabel(value)}
          </span>
        )}
      </div>

      {/* Progressive Disclosure: DAILY */}
      {value?.frequency === RecurrenceFrequency.DAILY && (
        <div className="pt-1.5 border-t border-border flex items-center gap-2 text-2xs text-foreground">
          <span>Repeat every</span>
          <input
            type="number"
            min={1}
            max={365}
            value={value.interval ?? 1}
            onChange={handleDailyIntervalChange}
            className="w-14 px-1.5 py-1 sm:py-0.5 text-base sm:text-xs text-center rounded border border-border bg-card text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
          <span>day(s)</span>
        </div>
      )}

      {/* Progressive Disclosure: WEEKLY */}
      {value?.frequency === RecurrenceFrequency.WEEKLY && (
        <div className="pt-1.5 border-t border-border space-y-1">
          <div className="text-2xs text-muted-foreground font-medium">Repeat on:</div>
          <div className="flex items-center flex-wrap gap-1 sm:gap-1.5">
            {WEEKDAYS.map((day) => {
              const isSelected = value.daysOfWeek?.includes(day.id) ?? false;
              return (
                <button
                  key={day.id}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={day.full}
                  onClick={() => handleToggleWeekday(day.id)}
                  className={`w-7 h-7 text-xs rounded-md border font-medium flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                      : 'bg-card text-foreground border-border hover:bg-accent hover:border-border/80'
                  }`}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
          {(!value.daysOfWeek || value.daysOfWeek.length === 0) && (
            <p className="text-2xs text-destructive font-medium">
              Please select at least one day of the week.
            </p>
          )}
        </div>
      )}

      {/* Progressive Disclosure: MONTHLY */}
      {value?.frequency === RecurrenceFrequency.MONTHLY && (
        <div className="pt-1.5 border-t border-border space-y-1.5">
          <div className="text-2xs text-muted-foreground font-medium">
            Repeat on day(s) of the month:
          </div>
          <div className="grid grid-cols-7 sm:grid-cols-11 gap-1 max-w-sm">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
              const isSelected = value.daysOfMonth?.includes(dayNum) ?? false;
              return (
                <button
                  key={dayNum}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`Day ${dayNum}`}
                  onClick={() => handleToggleMonthDay(dayNum)}
                  className={`w-7 h-7 sm:w-6 sm:h-6 text-xs sm:text-2xs rounded border flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                      : 'bg-card text-foreground border-border hover:bg-accent'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
          {(!value.daysOfMonth || value.daysOfMonth.length === 0) && (
            <p className="text-2xs text-destructive font-medium">
              Please select at least one day of the month.
            </p>
          )}
        </div>
      )}

      {/* Progressive Disclosure: YEARLY */}
      {value?.frequency === RecurrenceFrequency.YEARLY && (
        <div className="pt-1.5 border-t border-border flex items-center flex-wrap gap-2 text-2xs text-foreground">
          <span>Every year on:</span>
          <select
            value={selectedMonth}
            onChange={handleYearlyMonthChange}
            className="px-2 py-1 sm:py-0.5 text-base sm:text-xs rounded border border-border bg-card text-foreground shadow-2xs focus:ring-1 focus:ring-primary focus:outline-hidden"
          >
            {MONTHS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={value.yearlyDate?.day ?? 1}
            onChange={handleYearlyDayChange}
            className="px-2 py-1 sm:py-0.5 text-base sm:text-xs rounded border border-border bg-card text-foreground shadow-2xs focus:ring-1 focus:ring-primary focus:outline-hidden"
          >
            {Array.from({ length: maxYearlyDays }, (_, i) => i + 1).map((dayNum) => (
              <option key={dayNum} value={dayNum}>
                {dayNum}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Recurrence Horizon: Starts On & Ends On */}
      {value && (
        <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:flex-wrap gap-2.5 sm:gap-4 text-2xs text-foreground">
          {/* Starts on */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="recurrence-start-date"
              className="font-medium flex items-center gap-1 text-muted-foreground"
            >
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              <span>Starts on:</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="recurrence-start-date"
                type="date"
                value={value.startDate ?? (currentDate || '')}
                onChange={handleStartDateChange}
                className="px-2 py-1 sm:py-0.5 text-base sm:text-xs rounded border border-border bg-card text-foreground shadow-2xs focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
              {currentDate && (
                <button
                  type="button"
                  onClick={() => onChange({ ...value, startDate: currentDate })}
                  className="text-2xs px-2 py-1 sm:py-0.5 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium cursor-pointer"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Ends on */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="recurrence-end-date"
              className="font-medium flex items-center gap-1 text-muted-foreground"
            >
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Ends on (Optional):</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="recurrence-end-date"
                type="date"
                value={value.endDate ?? ''}
                onChange={handleEndDateChange}
                className="px-2 py-1 sm:py-0.5 text-base sm:text-xs rounded border border-border bg-card text-foreground shadow-2xs focus:ring-1 focus:ring-primary focus:outline-hidden"
              />
              {value.endDate && (
                <button
                  type="button"
                  onClick={() => onChange({ ...value, endDate: null })}
                  className="text-2xs px-2 py-1 sm:py-0.5 rounded hover:bg-destructive/10 text-destructive font-medium cursor-pointer"
                  title="Clear end date"
                >
                  Never
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
