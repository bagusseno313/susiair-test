import { describe, expect, it } from 'vitest';

import { FlightHoursService } from './flight-hours.service.js';

describe('FlightHoursService', () => {
  it('excludes records after the hardcoded Today from rolling sums', async () => {
    const result = await new FlightHoursService().getSummary('1w');
    const pointFor = (date: string) =>
      result.series.find((point) => point.date === date);

    expect(result.referenceDate).toBe('2026-05-15');
    expect(pointFor('2026-05-15')).toMatchObject({
      value: 25.2,
      missingDays: 0,
    });
    expect(pointFor('2026-05-16')).toMatchObject({
      value: 25.2,
      missingDays: 0,
    });
    expect(pointFor('2026-05-21')).toMatchObject({
      value: 6.4,
      missingDays: 0,
    });
    expect(pointFor('2026-05-22')).toMatchObject({
      value: 0,
      missingDays: 0,
    });
    expect(result.missingDays).toBe(0);
  });
});
