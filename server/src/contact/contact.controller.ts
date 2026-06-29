import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

/**
 * Public endpoint the Angular contact form + floating-help bubble POST to.
 *
 *   POST /api/contact
 *
 * Fires two emails via Resend:
 *   - internal notification to BOOKING_NOTIFY_EMAIL (reply-to = visitor)
 *   - branded confirmation back to the visitor (locale-aware copy)
 *
 * Returns 200 with { ok: true } when both emails dispatched; 200 with
 * { ok: false, ... } if either failed. We never throw — the frontend uses the
 * `ok` flag to decide whether to fire its Pixel/GA4 Lead event.
 */
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Post()
  @HttpCode(200)
  submit(@Body() dto: CreateContactDto) {
    return this.contact.submit(dto);
  }
}
