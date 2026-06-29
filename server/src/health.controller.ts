import { Controller, Get, Header } from '@nestjs/common';

@Controller('healthz')
export class HealthController {
  @Get()
  @Header('Cache-Control', 'no-store')
  check() {
    return { ok: true };
  }
}
