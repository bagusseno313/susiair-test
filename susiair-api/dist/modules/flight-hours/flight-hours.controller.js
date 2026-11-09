var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { FlightHoursService } from './flight-hours.service.js';
const VALID_RANGES = ['1w', '1m', '3m', '6m', '1y'];
let FlightHoursController = class FlightHoursController {
    flightHoursService;
    constructor(flightHoursService) {
        this.flightHoursService = flightHoursService;
    }
    async getRange(from, to) {
        if (!from || !to) {
            throw new BadRequestException('Both from and to query parameters are required.');
        }
        return this.flightHoursService.getRange(from, to);
    }
    async getSummary(range = '1m') {
        if (!VALID_RANGES.includes(range)) {
            throw new BadRequestException('range must be one of: 1w, 1m, 3m, 6m, 1y');
        }
        return this.flightHoursService.getSummary(range);
    }
};
__decorate([
    Get(),
    __param(0, Query('from')),
    __param(1, Query('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FlightHoursController.prototype, "getRange", null);
__decorate([
    Get('summary'),
    __param(0, Query('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FlightHoursController.prototype, "getSummary", null);
FlightHoursController = __decorate([
    Controller('flight-hours'),
    __metadata("design:paramtypes", [typeof (_a = typeof FlightHoursService !== "undefined" && FlightHoursService) === "function" ? _a : Object])
], FlightHoursController);
export { FlightHoursController };
//# sourceMappingURL=flight-hours.controller.js.map