import { BadRequestException } from '@nestjs/common';

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('Dates must be in YYYY-MM-DD format.');
  }

  const parsed = new Date(value + 'T00:00:00Z');

  if (Number.isNaN(parsed.getTime()) || toDateString(parsed) !== value) {
    throw new BadRequestException('Dates must be in YYYY-MM-DD format.');
  }

  return parsed;
}

export function getReferenceDate(): Date {
  const configuredReferenceDate = process.env.REFERENCE_DATE?.trim();

  return configuredReferenceDate
    ? parseDateOnly(configuredReferenceDate)
    : parseDateOnly(toDateString(new Date()));
}
