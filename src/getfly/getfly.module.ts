import { Module } from '@nestjs/common';
import { GetflyController } from './getfly.controller';
import { GetflyService } from './getfly.service';

@Module({
	controllers: [GetflyController],
	providers: [GetflyService],
})
export class GetflyModule {}
