import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { TrackEventDto } from './dto/track-event.dto';

/**
 * Server-side Meta Conversions API client.
 *
 * - Reads the Pixel ID + access token from environment variables
 *   (META_PIXEL_ID, META_CAPI_ACCESS_TOKEN).
 * - SHA-256 hashes PII fields per Meta's spec before sending.
 * - Forwards `event_id` so Meta can deduplicate browser-pixel and
 *   server-CAPI events in Events Manager.
 *
 * Reference: https://developers.facebook.com/docs/marketing-api/conversions-api
 */
@Injectable()
export class MetaCapiService {
  private readonly logger = new Logger(MetaCapiService.name);
  private readonly pixelId: string | undefined;
  private readonly accessToken: string | undefined;
  private readonly testEventCode: string | undefined;
  private readonly apiVersion = 'v19.0';

  /** PII keys that MUST be SHA-256 hashed before sending. */
  private static readonly HASHED_KEYS = new Set([
    'em', // email
    'ph', // phone
    'fn', // first name
    'ln', // last name
    'ct', // city
    'st', // state
    'zp', // zip
    'country',
    'external_id',
  ]);

  constructor(private readonly config: ConfigService) {
    this.pixelId = this.config.get<string>('META_PIXEL_ID');
    this.accessToken = this.config.get<string>('META_CAPI_ACCESS_TOKEN');
    this.testEventCode = this.config.get<string>('META_CAPI_TEST_EVENT_CODE');

    if (!this.pixelId || !this.accessToken) {
      this.logger.warn(
        'META_PIXEL_ID or META_CAPI_ACCESS_TOKEN is not set — CAPI calls will be skipped',
      );
    }
  }

  /**
   * Forward a single event to Meta CAPI. Throws nothing — logs and continues
   * so a Meta outage never breaks the user's flow.
   */
  async send(event: TrackEventDto, clientIp?: string): Promise<void> {
    if (!this.pixelId || !this.accessToken) return;

    const userData = this.normalizeUserData(event.user_data, clientIp);
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events?access_token=${this.accessToken}`;
    const body = {
      data: [
        {
          event_name: event.event_name,
          event_time: event.event_time,
          event_id: event.event_id,
          event_source_url: event.event_source_url,
          action_source: event.action_source,
          user_data: userData,
          custom_data: event.custom_data,
        },
      ],
      ...(this.testEventCode ? { test_event_code: this.testEventCode } : {}),
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
    } catch (err: any) {
      this.logger.error(
        `Meta CAPI send failed for ${event.event_name} (${event.event_id}): ${err.message ?? err}`,
      );
    }
  }

  /**
   * Normalize + hash user_data per Meta spec.
   * Plain-text values come in; SHA-256 hex hashes go out.
   */
  private normalizeUserData(
    raw: Record<string, string> | undefined,
    clientIp?: string,
  ): Record<string, string | string[]> {
    const out: Record<string, string | string[]> = {};
    if (raw) {
      for (const [key, value] of Object.entries(raw)) {
        if (!value) continue;
        if (MetaCapiService.HASHED_KEYS.has(key)) {
          out[key] = this.sha256(value.trim().toLowerCase());
        } else {
          out[key] = value;
        }
      }
    }
    if (clientIp) out['client_ip_address'] = clientIp;
    return out;
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }
}
