import { BadRequestException, Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';

export type FlightHoursRangeKey = '1w' | '1m' | '3m' | '6m' | '1y';

interface FlightHoursDataset {
  flightHours: Array<{
    date: string;
    hours: number;
  }>;
  chartBounds: Record<
    FlightHoursRangeKey,
    {
      limit: number;
      max: number;
      windowDays: number;
      displayRangeDays: number;
    }
  >;
}

export interface FlightHourPoint {
  date: string;
  hours: number;
}

export interface FlightHoursSummaryPoint {
  date: string;
  value: number;
  label: string;
}

export interface FlightHoursSummaryResponse {
  range: FlightHoursRangeKey;
  referenceDate: string;
  limit: number;
  max: number;
  windowDays: number;
  displayRangeDays: number;
  series: FlightHoursSummaryPoint[];
}

const RANGE_CONFIG: Record<
  FlightHoursRangeKey,
  { limit: number; max: number; windowDays: number; displayRangeDays: number }
> = {
  '1w': { limit: 40, max: 45, windowDays: 7, displayRangeDays: 7 },
  '1m': { limit: 100, max: 125, windowDays: 30, displayRangeDays: 7 },
  '3m': { limit: 300, max: 325, windowDays: 90, displayRangeDays: 7 },
  '6m': { limit: 600, max: 625, windowDays: 180, displayRangeDays: 7 },
  '1y': { limit: 1050, max: 1200, windowDays: 365, displayRangeDays: 7 },
};

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

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

@Injectable()
export class FlightHoursService {
  private readonly dataPath = new URL(
    '../../../../mock-flight-hours.json',
    import.meta.url,
  );

  private async loadDataset(): Promise<FlightHoursDataset> {
    const raw = await readFile(this.dataPath, 'utf8');
    return JSON.parse(raw) as FlightHoursDataset;
  }

  async getRange(from: string, to: string): Promise<FlightHourPoint[]> {
    const fromDate = parseDateOnly(from);
    const toDate = parseDateOnly(to);

    if (fromDate > toDate) {
      throw new BadRequestException(
        'The from date must be earlier than or equal to the to date.',
      );
    }

    const dataset = await this.loadDataset();
    const byDate = new Map(
      dataset.flightHours.map((entry) => [
        entry.date,
        Number(entry.hours ?? 0),
      ]),
    );

    const points: FlightHourPoint[] = [];
    const currentDate = new Date(fromDate);

    while (currentDate <= toDate) {
      const iso = toDateString(currentDate);
      const hours = Number((byDate.get(iso) ?? 0).toFixed(1));

      points.push({
        date: iso,
        hours,
      });

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return points;
  }

  async getSummary(
    range: FlightHoursRangeKey = '1m',
  ): Promise<FlightHoursSummaryResponse> {
    const key = (range in RANGE_CONFIG ? range : '1m') as FlightHoursRangeKey;
    const config = RANGE_CONFIG[key];
    const dataset = await this.loadDataset();
    const hoursByDate = new Map(
      dataset.flightHours.map((entry) => [
        entry.date,
        Number(entry.hours ?? 0),
      ]),
    );
    const referenceDate = new Date();

    const series: FlightHoursSummaryPoint[] = [];

    for (
      let offset = -config.displayRangeDays;
      offset <= config.displayRangeDays;
      offset += 1
    ) {
      const candidateDate = new Date(referenceDate);
      candidateDate.setUTCDate(referenceDate.getUTCDate() + offset);

      const windowStart = new Date(candidateDate);
      windowStart.setUTCDate(
        candidateDate.getUTCDate() - (config.windowDays - 1),
      );

      let totalHours = 0;
      const cursor = new Date(windowStart);

      while (cursor <= candidateDate) {
        const iso = toDateString(cursor);
        totalHours += hoursByDate.get(iso) ?? 0;
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      series.push({
        date: toDateString(candidateDate),
        value: Number(totalHours.toFixed(1)),
        label: formatShortDate(candidateDate),
      });
    }

    return {
      range: key,
      referenceDate: toDateString(referenceDate),
      limit: config.limit,
      max: config.max,
      windowDays: config.windowDays,
      displayRangeDays: config.displayRangeDays,
      series,
    };
  }
}
