import { afterEach, describe, expect, it, vi } from 'vitest';

import { FlightHoursService } from './flight-hours.service.js';

const originalReferenceDate = process.env.REFERENCE_DATE;

afterEach(() => {
  if (originalReferenceDate === undefined) {
    delete process.env.REFERENCE_DATE;
  } else {
    process.env.REFERENCE_DATE = originalReferenceDate;
  }

  vi.useRealTimers();
});

describe('FlightHoursService', () => {
  it('uses REFERENCE_DATE and reports missing calendar days', async () => {
    process.env.REFERENCE_DATE = '2024-12-27';

    const result = await new FlightHoursService().getSummary('1w');
    const referencePoint = result.series.find(
      (point) => point.date === '2024-12-27',
    );
    const zeroHourPoint = result.series.find(
      (point) => point.date === '2024-12-28',
    );

    expect(result.referenceDate).toBe('2024-12-27');
    expect(result.missingDays).toBe(13);
    expect(referencePoint).toMatchObject({
      value: 5.7,
      missingDays: 6,
    });
    expect(zeroHourPoint).toMatchObject({
      value: 5.7,
      missingDays: 5,
    });
  });

  it('does not report dates after the latest dataset date as missing', async () => {
    process.env.REFERENCE_DATE = '2026-05-31';

    const result = await new FlightHoursService().getSummary('1w');
    const futurePoint = result.series.find(
      (point) => point.date === '2026-06-01',
    );

    expect(result.missingDays).toBe(0);
    expect(futurePoint).toMatchObject({
      value: 12.1,
      missingDays: 0,
    });
  });

  it('uses today when REFERENCE_DATE is empty', async () => {
    process.env.REFERENCE_DATE = '';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T12:00:00.000Z'));

    const result = await new FlightHoursService().getSummary('1w');

    expect(result.referenceDate).toBe('2025-01-15');
  });

  it('rejects an invalid REFERENCE_DATE', async () => {
    process.env.REFERENCE_DATE = '2025-02-30';

    await expect(
      new FlightHoursService().getSummary('1w'),
    ).rejects.toThrow('Dates must be in YYYY-MM-DD format.');
  });
});
