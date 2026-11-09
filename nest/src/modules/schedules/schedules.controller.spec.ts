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
});

describe('SchedulesController', () => {
  it('defaults the requested month to REFERENCE_DATE', async () => {
    process.env.REFERENCE_DATE = '2026-05-31';
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
    process.env.REFERENCE_DATE = '2026-05-31';
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
