import { Controller, Post, Body } from '@nestjs/common';
import { MisaService } from './misa.service';

@Controller('misa')
export class MisaController {
  constructor(private readonly misaService: MisaService) {}

  @Post('callback')
  async misaCallback(@Body() body: any) {
    // Validate chữ ký SHA256HMAC
    const output = await this.misaService.handleCallback(body);
    return output;
  }
}
