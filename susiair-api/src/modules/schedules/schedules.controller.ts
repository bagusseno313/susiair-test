import { Controller, Get, Query } from '@nestjs/common';

import { SchedulesService } from './schedules.service.js';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  async getSchedules(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const targetYear = year ? Number(year) : new Date().getUTCFullYear();
    const targetMonth = month ? Number(month) : new Date().getUTCMonth() + 1;

    return this.schedulesService.getSchedulesForMonth(targetYear, targetMonth);
  }
}
