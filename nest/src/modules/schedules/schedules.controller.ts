import { Controller, Get, Query } from '@nestjs/common';

import { getReferenceDate } from '../../common/reference-date.js';
import { SchedulesService } from './schedules.service.js';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  async getSchedules(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const referenceDate = getReferenceDate();
    const targetYear = year ? Number(year) : referenceDate.getUTCFullYear();
    const targetMonth = month ? Number(month) : referenceDate.getUTCMonth() + 1;

    return this.schedulesService.getSchedulesForMonth(targetYear, targetMonth);
  }
}
