import { afterEach, describe, expect, it, vi } from 'vitest';

import { SchedulesController } from './schedules.controller.js';
import type { SchedulesService } from './schedules.service.js';

const originalReferenceDate = process.env.REFERENCE_DATE;

afterEach(() => {
  if (originalReferenceDate === undefined) {
    delete process.env.REFERENCE_DATE;
  } else {
    process.env.REFERENCE_DATE = originalReferenceDate;
  }

  vi.useRealTimers();
});

describe('SchedulesController', () => {
  it('defaults the requested month to the hardcoded reference date', async () => {
    process.env.REFERENCE_DATE = '2026-06-20';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T12:00:00.000Z'));

    const schedulesService = {
      getSchedulesForMonth: vi.fn().mockResolvedValue({}),
    };
    const controller = new SchedulesController(
      schedulesService as unknown as SchedulesService,
    );

    await controller.getSchedules();

    expect(schedulesService.getSchedulesForMonth).toHaveBeenCalledWith(
      2026,
      5,
    );
  });

  it('keeps explicitly requested year and month', async () => {
    const schedulesService = {
      getSchedulesForMonth: vi.fn().mockResolvedValue({}),
    };
    const controller = new SchedulesController(
      schedulesService as unknown as SchedulesService,
    );

    await controller.getSchedules('2026', '6');

    expect(schedulesService.getSchedulesForMonth).toHaveBeenCalledWith(
      2026,
      6,
    );
  });
});
