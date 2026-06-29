import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Minimal Resend client built on `fetch` (same dependency-free approach as
 * MetaCapiService) so we don't add an SDK to the server bundle.
 *
 * Required env vars (set in Render):
 *   RESEND_API_KEY        — Resend API key
 *   BOOKING_FROM_EMAIL    — verified sender, e.g. "Enduro Brothers <bookings@endurobrothersbulgaria.com>"
 *
 * Reference: https://resend.com/docs/api-reference/emails/send-email
 */
@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly apiKey: string | undefined;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.config.get<string>('BOOKING_FROM_EMAIL') ||
      'Enduro Brothers <bookings@endurobrothersbulgaria.com>';

    if (!this.apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not set — booking emails will be skipped',
      );
    }
  }

  /**
   * Send one email. Returns true on success, false on any failure — never
   * throws, so a Resend outage cannot break the booking flow.
   */
  async send({ to, subject, html, replyTo }: SendEmailParams): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject,
          html,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      return true;
    } catch (err: any) {
      this.logger.error(
        `Resend send failed (to=${to}, subject="${subject}"): ${err.message ?? err}`,
      );
      return false;
    }
  }
}
