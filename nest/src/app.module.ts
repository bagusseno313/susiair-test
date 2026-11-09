import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { FlightHoursModule } from './modules/flight-hours/flight-hours.module.js';
import { SchedulesModule } from './modules/schedules/schedules.module.js';

@Module({
  imports: [AuthModule, FlightHoursModule, DocumentsModule, SchedulesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
