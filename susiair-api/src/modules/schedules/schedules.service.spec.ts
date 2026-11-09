import { describe, expect, it } from 'vitest';

import { SchedulesService } from './schedules.service.js';

describe('SchedulesService', () => {
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
