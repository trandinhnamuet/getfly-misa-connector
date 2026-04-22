import { Module } from '@nestjs/common';
import { GetflyController } from './getfly.controller';
import { GetflyService } from './getfly.service';
import { GetflyApiService } from './getfly-api.service';
import { MisaModule } from '../misa/misa.module';

@Module({
  imports: [MisaModule],
  controllers: [GetflyController],
  providers: [GetflyService, GetflyApiService],
})
export class GetflyModule {}
