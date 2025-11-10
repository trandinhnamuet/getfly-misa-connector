import { Module } from '@nestjs/common';
import { GetflyController } from './getfly.controller';
import { GetflyService } from './getfly.service';
import { MisaModule } from '../misa/misa.module';

@Module({
	imports: [MisaModule],
	controllers: [GetflyController],
	providers: [GetflyService],
})
export class GetflyModule {}
