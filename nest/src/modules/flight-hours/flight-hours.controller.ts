import { BadRequestException, Controller, Get, Query } from '@nestjs/common';

import { FlightHoursService } from './flight-hours.service.js';
import type { FlightHoursRangeKey } from './flight-hours.service.js';

const VALID_RANGES: FlightHoursRangeKey[] = ['1w', '1m', '3m', '6m', '1y'];

@Controller('flight-hours')
export class FlightHoursController {
  constructor(private readonly flightHoursService: FlightHoursService) {}

  @Get()
  async getRange(@Query('from') from: string, @Query('to') to: string) {
    if (!from || !to) {
      throw new BadRequestException(
        'Both from and to query parameters are required.',
      );
    }

    return this.flightHoursService.getRange(from, to);
  }

  @Get('summary')
  async getSummary(@Query('range') range: FlightHoursRangeKey = '1m') {
    if (!VALID_RANGES.includes(range)) {
      throw new BadRequestException('range must be one of: 1w, 1m, 3m, 6m, 1y');
    }

    return this.flightHoursService.getSummary(range);
  }
}
