import { Module } from '@nestjs/common';
import { MisaController } from './misa.controller';
import { MisaService } from './misa.service';

@Module({
  controllers: [MisaController],
  providers: [MisaService],
})
export class MisaModule {}
