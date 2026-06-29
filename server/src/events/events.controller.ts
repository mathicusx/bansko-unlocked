import { Body, Controller, Headers, HttpCode, Ip, Post } from '@nestjs/common';
import { MetaCapiService } from './meta-capi.service';
import { TrackEventDto } from './dto/track-event.dto';

/**
 * Public endpoint the Angular PixelService calls for every Meta Pixel event.
 * Does NOT block the browser — returns 204 immediately and dispatches the
 * upstream Meta call in the background.
 *
 * Mounted under the global `api` prefix (see main.ts), so the live URL is
 *   POST /api/events/meta
 */
@Controller('events')
export class EventsController {
  constructor(private readonly capi: MetaCapiService) {}

  @Post('meta')
  @HttpCode(204)
  async track(
    @Body() event: TrackEventDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    // Enrich with server-side signals the browser can't safely provide.
    event.user_data = {
      ...event.user_data,
      ...(userAgent ? { client_user_agent: userAgent } : {}),
    };

    // Fire-and-forget: the response returns 204 even if the upstream is slow.
    void this.capi.send(event, ip);
  }
}
