import { afterEach, describe, expect, it } from 'vitest';

import { SchedulesService } from './schedules.service.js';

const originalReferenceDate = process.env.REFERENCE_DATE;

afterEach(() => {
  if (originalReferenceDate === undefined) {
    delete process.env.REFERENCE_DATE;
  } else {
    process.env.REFERENCE_DATE = originalReferenceDate;
  }
});

describe('SchedulesService', () => {
  it('uses REFERENCE_DATE for the calendar reference day', async () => {
    process.env.REFERENCE_DATE = '2026-05-31';

    const result = await new SchedulesService().getSchedulesForMonth(2026, 5);

    expect(result.today).toBe('2026-05-31');
  });
  it('should return all schedules for a month', async () => {
    const service = new SchedulesService();

    const result = await service.getSchedulesForMonth(2026, 5);

    expect(result).toHaveProperty('month');
    expect(result).toHaveProperty('year');
    expect(result).toHaveProperty('days');
    expect(result.days.length).toBeGreaterThan(0);
    expect(result.days[0]).toHaveProperty('duty_type');
  });

  it('should include legend entries and status metadata', async () => {
    const service = new SchedulesService();

    const result = await service.getSchedulesForMonth(2026, 5);

    expect(result.legend.length).toBeGreaterThan(0);
    expect(result.legend[0]).toHaveProperty('code');
    expect(result.legend[0]).toHaveProperty('color');
  });
});
