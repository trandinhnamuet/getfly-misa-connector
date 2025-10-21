import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GetflyModule } from './getfly/getfly.module';
import { MisaModule } from './misa/misa.module';

@Module({
  imports: [GetflyModule, MisaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
