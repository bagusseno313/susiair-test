import { BadRequestException, Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

export interface ScheduleLegendItem {
  code: string;
  label: string;
  color: string;
}

export interface ScheduleEntry {
  id: string;
  duty_date: string;
  status: number;
  base_name: string;
  base_color: string;
  duty_type: string;
  count_schedules: number;
  count_logbooks: number;
}

export interface ScheduleCalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  base_name: string | null;
  base_color: string | null;
  duty_type: string | null;
  count_schedules: number;
  count_logbooks: number;
  remainingDuties: number;
  isComplete: boolean;
  status: number | null;
}

export interface ScheduleCalendarResponse {
  month: number;
  year: number;
  today: string;
  legend: ScheduleLegendItem[];
  days: ScheduleCalendarDay[];
}

interface ScheduleDataset {
  today: string;
  legend: ScheduleLegendItem[];
  schedules: ScheduleEntry[];
}

function parseDateOnly(value: string): Date {
  const parsed = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Dates must be in YYYY-MM-DD format.');
  }

  return parsed;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class SchedulesService {
  private readonly dataPath = new URL(
    '../../../../mock-schedules.json',
    import.meta.url,
  );

  private async loadDataset(): Promise<ScheduleDataset> {
    const raw = await readFile(this.dataPath, 'utf8');
    return JSON.parse(raw) as ScheduleDataset;
  }

  async getSchedulesForMonth(
    year: number,
    month: number,
  ): Promise<ScheduleCalendarResponse> {
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      throw new BadRequestException('Year and month must be integers.');
    }

    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12.');
    }

    const dataset = await this.loadDataset();
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 0));
    const firstDayOfMonth = monthStart.getUTCDate();
    const lastDayOfMonth = monthEnd.getUTCDate();
    const scheduleMap = new Map(
      dataset.schedules.map((entry) => [entry.duty_date, entry]),
    );

    const days: ScheduleCalendarDay[] = [];

    for (let day = firstDayOfMonth; day <= lastDayOfMonth; day += 1) {
      const date = new Date(Date.UTC(year, month - 1, day));
      const isoDate = toDateString(date);
      const entry = scheduleMap.get(isoDate);
      const countSchedules = Number(entry?.count_schedules ?? 0);
      const countLogbooks = Number(entry?.count_logbooks ?? 0);
      const remainingDuties = Math.max(countSchedules - countLogbooks, 0);

      days.push({
        date: isoDate,
        day,
        inMonth: true,
        base_name: entry?.base_name ?? null,
        base_color: entry?.base_color ?? null,
        duty_type: entry?.duty_type ?? null,
        count_schedules: countSchedules,
        count_logbooks: countLogbooks,
        remainingDuties,
        isComplete: countSchedules > 0 && countLogbooks >= countSchedules,
        status: entry?.status ?? null,
      });
    }

    return {
      month,
      year,
      today: dataset.today,
      legend: dataset.legend,
      days,
    };
  }
}
