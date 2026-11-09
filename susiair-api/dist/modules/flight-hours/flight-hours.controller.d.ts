import { FlightHoursService } from './flight-hours.service.js';
import type { FlightHoursRangeKey } from './flight-hours.service.js';
export declare class FlightHoursController {
    private readonly flightHoursService;
    constructor(flightHoursService: FlightHoursService);
    getRange(from: string, to: string): Promise<any>;
    getSummary(range?: FlightHoursRangeKey): Promise<any>;
}
