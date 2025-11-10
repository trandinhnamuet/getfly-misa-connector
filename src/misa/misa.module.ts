import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MisaController } from './misa.controller';
import { MisaService } from './misa.service';
import { FileStorageService } from './services/file-storage.service';
import { MisaAuthService } from './services/misa-auth.service';
import { MisaDataService } from './services/misa-data.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [MisaController],
  providers: [
    MisaService,
    FileStorageService,
    MisaAuthService,
    MisaDataService
  ],
  exports: [MisaService], // Export để GetflyModule có thể sử dụng
})
export class MisaModule {}
