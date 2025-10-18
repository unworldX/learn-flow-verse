import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent, ReactNode } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Plus, Bell, Clock, Calendar as CalendarIcon, AlertCircle, CheckCircle, Trash2, RefreshCcw, Search, Layers, Edit } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/hooks/use-toast";

// Define core reminder types
export type Reminder = {
  id: string;
  title: string;
  description?: string;
  reminder_date: string;
  reminder_type: string;
  is_completed: boolean;
};

export type ReminderPriority = "overdue" | "high" | "medium" | "low";
export type EnhancedReminder = Reminder & { priority: ReminderPriority };
export type ReminderTypeOption = { value: string; label: string };

const canonicalizeTypeValue = (value: string | undefined) =>
  value?.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ") ?? "";

const BASE_TYPE_OPTIONS: ReminderTypeOption[] = [
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "general", label: "General" },
  { value: "study", label: "Study Session" },
  { value: "other", label: "Other" },
];

const BASE_TYPE_LABELS: Record<string, string> = {
  ...BASE_TYPE_OPTIONS.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
  }, {}),
  "study session": "Study Session",
};

const priorityFromDate = (dateStr: string): ReminderPriority => {
  // Parse the date string without timezone conversion
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return "low";
  
  const [, year, month, day, hour, minute] = match;
  const reminderDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute)
  );
  
  const diffHrs = (reminderDate.getTime() - Date.now()) / 36e5;
  if (diffHrs < 0) return "overdue";
  if (diffHrs <= 24) return "high";
  if (diffHrs <= 72) return "medium";
  return "low";
};

const getTypeIcon = (type: string) => {
  switch (canonicalizeTypeValue(type)) {
    case "exam":
      return AlertCircle;
    case "assignment":
      return Clock;
    case "study":
    case "study session":
      return CalendarIcon;
    default:
      return Bell;
  }
};

// --- Sub-components for better structure ---

const formatDateField = (isoDate: string | undefined) => {
  if (!isoDate) return "";
  // Extract just the date portion to avoid timezone conversion issues
  const match = isoDate.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
};

const formatTimeField = (isoDate: string | undefined) => {
  if (!isoDate) return "";
  // Extract just the time portion to avoid timezone conversion issues
  const match = isoDate.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : "";
};

const timeStringToLabel = (time: string) => {
  if (!time) return "";
  const [hourStr, minuteStr] = time.split(":");
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${normalizedHour}:${minuteStr} ${suffix}`;
};

const normalizeTypeValue = (rawValue: string | undefined, options: ReminderTypeOption[], fallback = "other") => {
  const canonical = canonicalizeTypeValue(rawValue);
  if (!canonical) return fallback;
  const normalized = options.find((option) => option.value === canonical);
  return normalized ? normalized.value : canonical;
};

const formatTypeLabel = (value: string | undefined) => {
  const canonical = canonicalizeTypeValue(value);
  if (!canonical) return BASE_TYPE_LABELS.other ?? "Other";
  if (BASE_TYPE_LABELS[canonical]) {
    return BASE_TYPE_LABELS[canonical];
  }
  return canonical
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const getDefaultDateTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  const nextSlot = new Date(now);
  nextSlot.setMinutes(roundedMinutes, 0, 0);
  return {
    date: format(nextSlot, "yyyy-MM-dd"),
    time: format(nextSlot, "HH:mm"),
  };
};

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

type ClockPosition = {
  top: string;
  left: string;
};

const getClockPosition = (index: number, total: number, radiusPercent: number): ClockPosition => {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const x = Math.cos(angle) * radiusPercent;
  const y = Math.sin(angle) * radiusPercent;
  return {
    top: `${50 + y}%`,
    left: `${50 + x}%`,
  };
};

type ParsedTime = {
  hour: number;
  minute: number;
  isPm: boolean;
};

const parseTimeValue = (value?: string): ParsedTime => {
  if (!value) return { hour: 12, minute: 0, isPm: false };
  const [hourStr, minuteStr] = value.split(":");
  const hour24 = Number(hourStr);
  const minute = Number(minuteStr);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return { hour: 12, minute: 0, isPm: false };
  }
  const isPm = hour24 >= 12;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const roundedMinute = Math.max(0, Math.min(55, Math.round(minute / 5) * 5));
  return { hour: hour12, minute: roundedMinute, isPm };
};

const formatTimeValue = (hour: number, minute: number, isPm: boolean) => {
  const normalizedHour = ((Math.round(hour) - 1 + 12) % 12) + 1;
  const normalizedMinute = Math.max(0, Math.min(55, Math.round(minute / 5) * 5));
  let hour24 = normalizedHour % 12;
  if (isPm) {
    hour24 += 12;
  }
  if (!isPm && normalizedHour === 12) {
    hour24 = 0;
  }
  if (isPm && normalizedHour === 12) {
    hour24 = 12;
  }
  return `${String(hour24).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`;
};

type CircularTimePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
};

const CircularTimePicker = ({ value, onChange, onComplete }: CircularTimePickerProps) => {
  const parsed = useMemo(() => parseTimeValue(value), [value]);
  const [mode, setMode] = useState<'hour' | 'minute'>(value ? 'minute' : 'hour');
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [isPm, setIsPm] = useState(parsed.isPm);

  useEffect(() => {
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setIsPm(parsed.isPm);
    if (!value) {
      setMode('hour');
    }
  }, [parsed, value]);

  const updateTime = useCallback((nextHour: number, nextMinute: number, nextIsPm: boolean) => {
    const normalizedHour = ((Math.round(nextHour) - 1 + 12) % 12) + 1;
    const normalizedMinute = Math.max(0, Math.min(55, Math.round(nextMinute / 5) * 5));
    setHour(normalizedHour);
    setMinute(normalizedMinute);
    setIsPm(nextIsPm);
    onChange(formatTimeValue(normalizedHour, normalizedMinute, nextIsPm));
  }, [onChange]);

  const handleHourClick = useCallback((hourValue: number) => {
    updateTime(hourValue, minute, isPm);
    setMode('minute');
  }, [isPm, minute, updateTime]);

  const handleMinuteClick = useCallback((minuteValue: number) => {
    updateTime(hour, minuteValue, isPm);
    onComplete?.();
  }, [hour, isPm, onComplete, updateTime]);

  const handlePeriodClick = useCallback((periodIsPm: boolean) => {
    updateTime(hour, minute, periodIsPm);
  }, [hour, minute, updateTime]);

  const displayLabel = useMemo(() => (value ? timeStringToLabel(value) : ""), [value]);
  const clockItems = useMemo(() => (mode === 'hour' ? HOURS : MINUTES), [mode]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>{mode === 'hour' ? 'Select hour' : 'Select minute'}</span>
        <div className="inline-flex overflow-hidden rounded-md border border-border">
          <button
            type="button"
            className={cn(
              "px-2 py-1 text-[11px] transition",
              mode === 'hour'
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            )}
            aria-pressed={mode === 'hour'}
            onClick={() => setMode('hour')}
          >
            Hour
          </button>
          <button
            type="button"
            className={cn(
              "px-2 py-1 text-[11px] transition",
              mode === 'minute'
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            )}
            aria-pressed={mode === 'minute'}
            onClick={() => setMode('minute')}
          >
            Minute
          </button>
        </div>
      </div>
      <div className="relative mx-auto h-44 w-44">
        <div className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-border bg-background/95 text-center shadow-sm">
          <span className="text-base font-semibold leading-none">{displayLabel || "--:--"}</span>
          <span className="text-[9px] uppercase text-muted-foreground">{mode === 'hour' ? 'hour' : 'minute'}</span>
        </div>
        {clockItems.map((item, index, array) => {
          const isActive = mode === 'hour' ? item === hour : item === minute;
          const style = getClockPosition(index, array.length, 38);
          return (
            <button
              key={item}
              type="button"
              className={cn(
                "absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-sm font-semibold transition",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow"
                  : "border-border bg-background/90 hover:bg-muted"
              )}
              style={style}
              aria-pressed={isActive}
              aria-label={
                mode === 'hour'
                  ? `Select ${item} ${item === 1 ? 'hour' : 'hours'}`
                  : `Select ${String(item).padStart(2, '0')} minutes`
              }
              onClick={() => (mode === 'hour' ? handleHourClick(item) : handleMinuteClick(item))}
            >
              {mode === 'hour' ? item : String(item).padStart(2, '0')}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          className={cn(
            "w-14 rounded-md border px-2 py-1 text-xs font-medium transition",
            !isPm
              ? "border-primary bg-primary text-primary-foreground shadow"
              : "border-border bg-background hover:bg-muted"
          )}
          aria-pressed={!isPm}
          onClick={() => handlePeriodClick(false)}
        >
          AM
        </button>
        <button
          type="button"
          className={cn(
            "w-14 rounded-md border px-2 py-1 text-xs font-medium transition",
            isPm
              ? "border-primary bg-primary text-primary-foreground shadow"
              : "border-border bg-background hover:bg-muted"
          )}
          aria-pressed={isPm}
          onClick={() => handlePeriodClick(true)}
        >
          PM
        </button>
      </div>
    </div>
  );
};

type ReminderFormValues = {
  id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: string;
  priority: ReminderPriority;
};

type ReminderFormProps = {
  reminder?: Reminder | EnhancedReminder | null;
  onSave: (values: ReminderFormValues) => void;
  onCancel: () => void;
  typeOptions: ReminderTypeOption[];
  defaultDate: string;
  defaultTime: string;
};

const ReminderForm = ({ reminder, onSave, onCancel, typeOptions, defaultDate, defaultTime }: ReminderFormProps) => {
  const [form, setForm] = useState<ReminderFormValues>(() => ({
    id: undefined,
    title: "",
    description: "",
    date: defaultDate,
    time: defaultTime,
    type: canonicalizeTypeValue("general") || "general",
    priority: "medium",
  }));
  const [dateTimePopoverOpen, setDateTimePopoverOpen] = useState(false);

  const handleDateSelect = useCallback((date?: Date) => {
    setForm((prev) => ({ ...prev, date: date ? format(date, "yyyy-MM-dd") : "" }));
  }, []);

  const handleTimeChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, time: value }));
  }, []);

  useEffect(() => {
    if (reminder) {
      setForm({
        id: reminder.id,
        title: reminder.title,
        description: reminder.description ?? "",
        date: formatDateField(reminder.reminder_date),
        time: formatTimeField(reminder.reminder_date),
        type: canonicalizeTypeValue(reminder.reminder_type) || "other",
        priority: (reminder as EnhancedReminder).priority || "medium",
      });
    } else {
      setForm({
        id: undefined,
        title: "",
        description: "",
        date: defaultDate,
        time: defaultTime,
        type: canonicalizeTypeValue("general") || "general",
        priority: "medium",
      });
    }
  }, [reminder, defaultDate, defaultTime]);

  useEffect(() => {
    setForm((prev) => {
      const normalizedType = normalizeTypeValue(prev.type, typeOptions);
      if (normalizedType === prev.type) {
        return prev;
      }
      return { ...prev, type: normalizedType };
    });
  }, [typeOptions]);

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    onSave(form);
  };

  const selectedDate = useMemo(() => {
    return form.date ? new Date(`${form.date}T00:00:00`) : undefined;
  }, [form.date]);
  const dateTimeLabel = useMemo(() => {
    if (form.date && selectedDate && form.time) {
      return `${format(selectedDate, "PPP")} at ${timeStringToLabel(form.time)}`;
    }
    if (form.date && selectedDate) return `${format(selectedDate, "PPP")}`;
    if (form.time) return `${timeStringToLabel(form.time)}`;
    return "Pick date & time";
  }, [form.date, form.time, selectedDate]);

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={form.title}
            placeholder="e.g. Biology Lab Report"
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Add more details..."
            rows={3}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={form.priority}
              onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value as ReminderPriority }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="dueDateTime">Due Date & Time *</Label>
          <Popover open={dateTimePopoverOpen} onOpenChange={setDateTimePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                id="dueDateTime"
                type="button"
                variant="outline"
                className={cn(
              "mt-1 w-full justify-start text-left font-normal",
                  !form.date && !form.time && "text-muted-foreground"
                )}
                aria-label="Select due date and time"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTimeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[520px] max-w-[90vw] p-0" align="start">
              <div className="flex flex-col gap-4 p-4 md:flex-row md:gap-6">
                  <div className="flex-1">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      className="rounded-md border border-border/60 bg-background"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-4">
                    <CircularTimePicker
                      value={form.time}
                      onChange={handleTimeChange}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label="Close date and time picker"
                        onClick={() => setDateTimePopoverOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
      </div>
      <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2 space-y-2 sm:space-y-0">
        <Button type="submit" className="w-full sm:w-auto">
          Save Reminder
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
      </DialogFooter>
    </form>
  );
};

type ReminderCardProps = {
  reminder: EnhancedReminder;
  onToggle: (id: string, complete: boolean) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onEdit: (reminder: EnhancedReminder) => void;
};

const ReminderCard = memo(({ reminder, onToggle, onDelete, onEdit }: ReminderCardProps) => {
  const IconComponent = useMemo(() => getTypeIcon(reminder.reminder_type), [reminder.reminder_type]);
  const priorityColor = useMemo(() => ({
    overdue: "bg-red-700 border-red-700/50",
    high: "bg-red-500 border-red-500/50",
    medium: "bg-yellow-500 border-yellow-500/50",
    low: "bg-green-500 border-green-500/50",
  }[reminder.priority]), [reminder.priority]);
  const priorityLabel = useMemo(() => formatTypeLabel(reminder.priority), [reminder.priority]);
  const formattedDate = useMemo(() => {
    const dateValue = formatDateField(reminder.reminder_date);
    if (!dateValue) return "";
    // Parse without timezone conversion
    const [year, month, day] = dateValue.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);
    return format(localDate, "PPP");
  }, [reminder.reminder_date]);
  const formattedTime = useMemo(() => {
    const timeValue = formatTimeField(reminder.reminder_date);
    return timeValue ? timeStringToLabel(timeValue) : "";
  }, [reminder.reminder_date]);
  const typeLabel = useMemo(() => formatTypeLabel(reminder.reminder_type), [reminder.reminder_type]);

  const handleToggle = useCallback(
    (checked: boolean | "indeterminate") => {
      onToggle(reminder.id, checked === true);
    },
    [onToggle, reminder.id]
  );

  const handleEditClick = useCallback(() => {
    onEdit(reminder);
  }, [onEdit, reminder]);

  const handleDeleteClick = useCallback(() => {
    onDelete(reminder.id);
  }, [onDelete, reminder.id]);

  return (
    <Card className={`transition-all hover:shadow-lg bg-card/80 backdrop-blur-sm ${reminder.is_completed ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={reminder.is_completed}
            onCheckedChange={handleToggle}
            className="mt-1.5 h-5 w-5 rounded-full"
            aria-label={reminder.is_completed ? "Mark reminder as incomplete" : "Mark reminder as complete"}
          />

          <div className="flex-1 space-y-2">
            <h3 className={`font-semibold ${reminder.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {reminder.title}
            </h3>
            {reminder.description && (
              <p className="text-sm text-muted-foreground">{reminder.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <IconComponent className="h-3.5 w-3.5" />
                <span className="capitalize">{typeLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{formattedTime}</span>
              </div>
              {!reminder.is_completed && (
                <Badge
                  variant="secondary"
                  className={`capitalize ${priorityColor} text-white`}
                >
                  {priorityLabel}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Edit reminder"
              onClick={handleEditClick}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-500/80 hover:text-red-500"
              aria-label="Delete reminder"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ReminderCard.displayName = "ReminderCard";

type ReminderListProps = {
  reminders: EnhancedReminder[];
  emptyState: ReactNode;
  onToggle: (id: string, complete: boolean) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onEdit: (reminder: EnhancedReminder) => void;
  isLoading: boolean;
};

const ReminderList = memo(({ reminders, emptyState, onToggle, onDelete, onEdit, isLoading }: ReminderListProps) => {
  const groupedByDay = useMemo(() => {
    const grouped = reminders.reduce<Record<string, EnhancedReminder[]>>((acc, reminderItem) => {
      const dayKey = formatDateField(reminderItem.reminder_date) || "unknown";
      if (!acc[dayKey]) acc[dayKey] = [];
      acc[dayKey].push(reminderItem);
      return acc;
    }, {});

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [reminders]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  if (groupedByDay.length === 0) return <>{emptyState}</>;

  return (
    <div className="space-y-6">
      {groupedByDay.map(([dayKey, items]) => {
        // Parse date without timezone conversion
        const [year, month, day] = dayKey.split("-").map(Number);
        const dayDate = new Date(year, month - 1, day);
        const formattedDay = format(dayDate, "PPP");
        return (
          <div key={dayKey}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-border" />
              <h4 className="text-sm font-semibold tracking-wide text-muted-foreground">{formattedDay}</h4>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="space-y-3">
              {items.map((reminderItem) => (
                <ReminderCard
                  key={reminderItem.id}
                  reminder={reminderItem}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

ReminderList.displayName = "ReminderList";

const Reminders = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [priorityFilter, setPriorityFilter] = useState<'all' | ReminderPriority>('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<EnhancedReminder | null>(null);

  const { reminders, isLoading, createReminder, updateReminder, deleteReminder, refetch } = useReminders();
  const { user } = useAuth();
  const { toast } = useToast();

  const [newReminderDefaults, setNewReminderDefaults] = useState(getDefaultDateTime);

  const typeOptions = useMemo<ReminderTypeOption[]>(() => {
    const seen = new Set<string>();
    const options: ReminderTypeOption[] = [];

    const addOption = (value: string, label?: string) => {
      const canonical = canonicalizeTypeValue(value);
      if (!canonical || seen.has(canonical)) return;
      seen.add(canonical);
      options.push({ value: canonical, label: label ?? formatTypeLabel(value) });
    };

    BASE_TYPE_OPTIONS.forEach((option) => addOption(option.value, option.label));
    reminders.forEach((reminderItem) => {
      if (reminderItem.reminder_type) {
        addOption(reminderItem.reminder_type, formatTypeLabel(reminderItem.reminder_type));
      }
    });

    return options;
  }, [reminders]);

  const handleEdit = useCallback((reminderToEdit: EnhancedReminder) => {
    setEditingReminder(reminderToEdit);
    setIsFormOpen(true);
  }, []);
  
  const handleCreateNew = useCallback(() => {
    setNewReminderDefaults(getDefaultDateTime());
    setEditingReminder(null);
    setIsFormOpen(true);
  }, [setNewReminderDefaults]);
  
  const handleFormCancel = useCallback(() => {
    setEditingReminder(null);
    setIsFormOpen(false);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingReminder(null);
    }
  }, []);

  const handleSave = useCallback(async (formData: ReminderFormValues) => {
    if (!formData.title || !formData.date || !formData.time) {
      toast({ title: 'Missing fields', description: 'Title, date, and time are required', variant: 'destructive' });
      return;
    }

    // Store as ISO8601 format without timezone conversion
    // This preserves the exact date and time selected by the user
    const reminderDateTime = `${formData.date}T${formData.time}:00`;
    
    const reminderType = normalizeTypeValue(formData.type, typeOptions);
    const reminderData = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      reminder_date: reminderDateTime,
      reminder_type: reminderType,
    };

    if (formData.id) {
      await updateReminder(formData.id, reminderData);
      toast({ title: 'Success!', description: 'Reminder has been updated.' });
    } else {
      await createReminder(reminderData);
      toast({ title: 'Success!', description: 'New reminder created.' });
    }
    
    setIsFormOpen(false);
    setEditingReminder(null);
  }, [createReminder, toast, updateReminder, typeOptions]);
  
  const handleDelete = useCallback(async (id: string) => {
    await deleteReminder(id);
    toast({ title: 'Reminder Deleted', variant: 'destructive' });
  }, [deleteReminder, toast]);
  
  const toggleComplete = useCallback(async (id: string, complete: boolean) => {
    await updateReminder(id, { is_completed: complete });
    toast({ title: `Reminder marked as ${complete ? 'complete' : 'incomplete'}.` });
  }, [toast, updateReminder]);

  const handlePriorityChange = useCallback((value: string) => {
    setPriorityFilter(value as ReminderPriority | 'all');
  }, []);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  const handleSelectAll = useCallback(() => {
    setPriorityFilter('all');
  }, []);

  const handleSelectUpcoming = useCallback(() => {
    setActiveTab('upcoming');
    setPriorityFilter('all');
  }, []);

  const handleSelectHighPriority = useCallback(() => {
    setActiveTab('upcoming');
    setPriorityFilter('high');
  }, []);

  const handleTotalCardKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelectAll();
    }
  }, [handleSelectAll]);

  const handleUpcomingCardKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelectUpcoming();
    }
  }, [handleSelectUpcoming]);

  const handleHighPriorityCardKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelectHighPriority();
    }
  }, [handleSelectHighPriority]);

  const enhancedReminders = useMemo<EnhancedReminder[]>(
    () =>
      reminders.map((reminderItem) => ({
        ...reminderItem,
        priority: priorityFromDate(reminderItem.reminder_date),
      })),
    [reminders]
  );

  const filteredReminders = useMemo<EnhancedReminder[]>(
    () =>
      enhancedReminders
        .filter((reminderItem) => {
          if (priorityFilter !== 'all' && reminderItem.priority !== priorityFilter) return false;
          if (search) {
            const query = search.toLowerCase();
            return (
              reminderItem.title.toLowerCase().includes(query) ||
              (reminderItem.description ?? '').toLowerCase().includes(query)
            );
          }
          return true;
        })
        .sort((a, b) => {
          // Simple string comparison works for ISO8601 format (YYYY-MM-DDTHH:MM:SS)
          return sortOrder === 'asc' 
            ? a.reminder_date.localeCompare(b.reminder_date)
            : b.reminder_date.localeCompare(a.reminder_date);
        }),
    [enhancedReminders, priorityFilter, search, sortOrder]
  );

  const splitReminders = useMemo(() => {
    const upcomingList: EnhancedReminder[] = [];
    const completedList: EnhancedReminder[] = [];
    filteredReminders.forEach((reminderItem) => {
      if (reminderItem.is_completed) {
        completedList.push(reminderItem);
      } else {
        upcomingList.push(reminderItem);
      }
    });
    return { upcomingReminders: upcomingList, completedReminders: completedList };
  }, [filteredReminders]);

  const { upcomingReminders, completedReminders } = splitReminders;

  const completionRate = useMemo(() => {
    if (reminders.length === 0) return 0;
    return Math.round((reminders.filter(r => r.is_completed).length / reminders.length) * 100);
  }, [reminders]);


  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">...</div>;
  }

  return (
    <div className="h-[calc(100vh-3rem)] bg-muted/40 p-4 md:p-8 overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 flex-shrink-0">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
                <p className="text-muted-foreground">Your central hub for tasks and deadlines.</p>
            </div>
             <Dialog
              open={isFormOpen}
              onOpenChange={handleDialogOpenChange}
            >
              <DialogTrigger asChild>
                <Button type="button" onClick={handleCreateNew} className="w-full md:w-auto">
                  <Plus className="w-4 h-4 mr-2" /> New Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingReminder ? 'Edit Reminder' : 'Create a New Reminder'}</DialogTitle>
                  <DialogDescription>
                    {editingReminder ? 'Update the details and keep your schedule fresh.' : 'Create a reminder to stay on top of deadlines.'}
                  </DialogDescription>
                </DialogHeader>
                <ReminderForm
                  reminder={editingReminder}
                  onSave={handleSave}
                  onCancel={handleFormCancel}
                  typeOptions={typeOptions}
                  defaultDate={newReminderDefaults.date}
                  defaultTime={newReminderDefaults.time}
                />
              </DialogContent>
            </Dialog>
        </div>

        {/* Quick Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
      <Card
        onClick={handleSelectAll}
        onKeyDown={handleTotalCardKeyDown}
        role="button"
        tabIndex={0}
        aria-pressed={priorityFilter === 'all'}
        className="cursor-pointer hover:border-primary"
      >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total</CardTitle><Layers className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{reminders.length}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completion</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{completionRate}%</div></CardContent>
            </Card>
       <Card
        onClick={handleSelectUpcoming}
        onKeyDown={handleUpcomingCardKeyDown}
        role="button"
        tabIndex={0}
              aria-pressed={activeTab === 'upcoming' && priorityFilter === 'all'}
        className="cursor-pointer hover:border-primary"
      >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Upcoming</CardTitle><Bell className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{upcomingReminders.length}</div></CardContent>
            </Card>
      <Card
        onClick={handleSelectHighPriority}
        onKeyDown={handleHighPriorityCardKeyDown}
        role="button"
        tabIndex={0}
        aria-pressed={priorityFilter === 'high'}
        className="cursor-pointer hover:border-red-500"
      >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">High Priority</CardTitle><AlertCircle className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{enhancedReminders.filter(r => r.priority === 'high' || r.priority === 'overdue').length}</div></CardContent>
            </Card>
        </div>

        {/* Controls & Main Content */}
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
          <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
             <div className="flex flex-col md:flex-row items-center gap-4 mb-4 flex-shrink-0">
                <div className="relative w-full md:flex-1">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={search}
                      onChange={handleSearchChange}
                      placeholder="Search reminders..."
                      aria-label="Search reminders"
                      className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Select value={priorityFilter} onValueChange={handlePriorityChange}>
                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Filter priority" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                     <Button variant="outline" size="sm" onClick={handleSortOrderToggle}>{sortOrder === 'asc' ? 'Date Asc' : 'Date Desc'}</Button>
                     <Button variant="ghost" size="icon" onClick={handleRefresh} aria-label="Refresh reminders">
                       <RefreshCcw className="w-4 h-4" />
                     </Button>
                </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
              <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="mt-4 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
                <ScrollArea className="flex-1 h-full pr-4">
                  <ReminderList
                    isLoading={isLoading}
                    reminders={upcomingReminders}
                    onToggle={toggleComplete}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    emptyState={
                      <div className="text-center py-16">
                        <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
                        <p className="mt-1 text-sm text-muted-foreground">No upcoming reminders match your filters.</p>
                      </div>
                    }
                  />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="completed" className="mt-4 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
                <ScrollArea className="flex-1 h-full pr-4">
                  <div className="space-y-3">
                     {completedReminders.length > 0 ? (
                          completedReminders.map(r => <ReminderCard key={r.id} reminder={r} onToggle={toggleComplete} onDelete={handleDelete} onEdit={handleEdit} />)
                     ) : (
                      <div className="text-center py-16">
                        <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-semibold">Nothing completed yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Completed reminders will appear here.</p>
                      </div>
                     )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reminders;