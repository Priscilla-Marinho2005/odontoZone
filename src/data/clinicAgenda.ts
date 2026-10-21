import type { Responsible } from "./clinicPatients";
import { responsibles } from "./clinicPatients";

export type DayHours = {
  start: string;
  end: string;
  enabled: boolean;
};

export type ProfessionalSchedule = Record<number, DayHours>;

const weekdayHours = { start: "08:00", end: "18:00", enabled: true };
const saturdayHours = { start: "08:00", end: "12:00", enabled: true };
const sundayHours = { start: "08:00", end: "12:00", enabled: false };

export function defaultDaySchedule(): ProfessionalSchedule {
  return {
    0: { ...sundayHours },
    1: { ...weekdayHours },
    2: { ...weekdayHours },
    3: { ...weekdayHours },
    4: { ...weekdayHours },
    5: { ...weekdayHours },
    6: { ...saturdayHours },
  };
}

export function defaultSchedules(): Record<Responsible, ProfessionalSchedule> {
  return Object.fromEntries(responsibles.map((name) => [name, defaultDaySchedule()])) as Record<Responsible, ProfessionalSchedule>;
}

export const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function rangesOverlap(startA: string, durationA: number, startB: string, durationB: number) {
  const a0 = timeToMinutes(startA);
  const a1 = a0 + durationA;
  const b0 = timeToMinutes(startB);
  const b1 = b0 + durationB;
  return a0 < b1 && b0 < a1;
}

export function withinSchedule(schedule: ProfessionalSchedule, isoDate: string, time: string, durationMin: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = new Date(year, (month ?? 1) - 1, day ?? 1).getDay();
  const hours = schedule[weekday];
  if (!hours?.enabled) return false;
  const start = timeToMinutes(time);
  const end = start + durationMin;
  return start >= timeToMinutes(hours.start) && end <= timeToMinutes(hours.end);
}
