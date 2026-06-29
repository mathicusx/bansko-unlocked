import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ResendService } from '../email/resend.service';

/**
 * Public booking stats returned by GET /api/bookings/stats. Both fields are
 * NULL when their respective quotas aren't met — the frontend never renders
 * a low-number social-proof badge, because "1 rider booked last month" reads
 * as dead, not popular.
 */
export interface BookingStats {
  /** Site-wide bookings in the last 30 days, or null below RECENT_MIN. */
  recentBookings: number | null;
  /** Most-requested upcoming month, or null below MONTH_MIN. */
  popularMonth: { year: number; month: number; count: number } | null;
}

// Quota thresholds — tune as volume grows. Below these, the badge stays
// hidden rather than printing an unflattering "1 booked" line.
const RECENT_MIN = 5;
const MONTH_MIN = 4;
const STATS_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class BookingsService implements OnModuleInit {
  private readonly logger = new Logger(BookingsService.name);
  private readonly notifyEmail: string;

  constructor(
    @InjectRepository(Booking)
    private readonly bookings: Repository<Booking>,
    private readonly resend: ResendService,
    private readonly config: ConfigService,
  ) {
    this.notifyEmail =
      this.config.get<string>('BOOKING_NOTIFY_EMAIL') ||
      'info@endurobrothersbulgaria.com';
  }

  /**
   * Production runs with synchronize:false, so create the table idempotently
   * on startup (mirrors ToursService.onModuleInit). Safe to run every boot.
   */
  async onModuleInit() {
    try {
      await this.bookings.query(`
        CREATE TABLE IF NOT EXISTS bookings (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "tourId" varchar,
          "tourSlug" varchar,
          "tourTitle" varchar NOT NULL,
          "customerName" varchar NOT NULL,
          "customerEmail" varchar NOT NULL,
          "customerPhone" varchar NOT NULL DEFAULT '',
          "preferredContact" varchar(20) NOT NULL DEFAULT 'whatsapp',
          "preferredContactOther" varchar,
          "experienceLevels" text NOT NULL,
          "numberOfRiders" int NOT NULL,
          "preferredDates" varchar NOT NULL,
          "startDate" date,
          "endDate" date,
          extras text,
          "depositAmount" numeric(10,2) NOT NULL,
          currency varchar(3) NOT NULL,
          "paypalOrderId" varchar,
          locale varchar(5) NOT NULL DEFAULT 'en',
          "emailsSent" boolean NOT NULL DEFAULT false,
          "createdAt" timestamp NOT NULL DEFAULT now()
        )
      `);
      // Idempotent column adds for tables created by an earlier version.
      await this.bookings.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "customerPhone" varchar NOT NULL DEFAULT ''`,
      );
      await this.bookings.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "preferredContact" varchar(20) NOT NULL DEFAULT 'whatsapp'`,
      );
      await this.bookings.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "preferredContactOther" varchar`,
      );
      await this.bookings.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "startDate" date`,
      );
      await this.bookings.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "endDate" date`,
      );

      // Attribution columns — added in the booking-attribution feature so
      // existing prod rows backfill as NULL rather than blocking the migration.
      const attributionCols: Array<[string, string]> = [
        ['attributionChannel', 'varchar(40)'],
        ['attributionSource', 'varchar(120)'],
        ['attributionMedium', 'varchar(60)'],
        ['attributionCampaign', 'varchar(200)'],
        ['attributionReferrer', 'varchar(500)'],
        ['attributionLandingPath', 'varchar(500)'],
        ['attributionGclid', 'varchar(200)'],
        ['attributionFbclid', 'varchar(200)'],
        ['attributionMsclkid', 'varchar(200)'],
        ['attributionCapturedAt', 'timestamp'],
      ];
      for (const [name, type] of attributionCols) {
        await this.bookings.query(
          `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "${name}" ${type}`,
        );
      }
      // Channel is the field every commission query buckets on — index it.
      await this.bookings.query(
        `CREATE INDEX IF NOT EXISTS idx_bookings_attribution_channel ON bookings ("attributionChannel")`,
      );

      // Commission trigger — only completed tours flow into rev-share reports.
      await this.bookings.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "tourCompletedAt" timestamp`,
      );

      // Lifecycle: pending → completed | no-show | cancelled. Default 'pending'
      // backfills cleanly on existing rows.
      await this.bookings.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "status" varchar(20) NOT NULL DEFAULT 'pending'`,
      );
      await this.bookings.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "cancelledAt" timestamp`,
      );
      // Backfill: if tourCompletedAt was set under the old single-column model,
      // promote the row to status='completed' so summary queries are correct.
      await this.bookings.query(
        `UPDATE bookings SET status = 'completed' WHERE "tourCompletedAt" IS NOT NULL AND status = 'pending'`,
      );
      await this.bookings.query(
        `CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings ("status")`,
      );
    } catch (err) {
      this.logger.warn(
        `bookings table bootstrap skipped: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Persist the booking first (so it's never lost), then dispatch both emails.
   * Email failures are logged but do NOT fail the request — the rider has
   * already paid, so we always return the saved booking.
   */
  async create(dto: CreateBookingDto): Promise<Booking> {
    const booking = this.bookings.create({
      tourId: dto.tourId ?? null,
      tourSlug: dto.tourSlug ?? null,
      tourTitle: dto.tourTitle,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      preferredContact: dto.preferredContact,
      preferredContactOther: dto.preferredContactOther ?? null,
      experienceLevels: dto.experienceLevels,
      numberOfRiders: dto.numberOfRiders,
      preferredDates: dto.preferredDates,
      startDate: dto.startDate ? dto.startDate.slice(0, 10) : null,
      endDate: dto.endDate ? dto.endDate.slice(0, 10) : null,
      extras: dto.extras && dto.extras.length ? dto.extras : null,
      depositAmount: dto.depositAmount,
      currency: dto.currency.toUpperCase(),
      paypalOrderId: dto.paypalOrderId ?? null,
      locale: dto.locale ?? 'en',
      attributionChannel: dto.attribution?.channel ?? null,
      attributionSource: dto.attribution?.source ?? null,
      attributionMedium: dto.attribution?.medium ?? null,
      attributionCampaign: dto.attribution?.campaign ?? null,
      attributionReferrer: dto.attribution?.referrer ?? null,
      attributionLandingPath: dto.attribution?.landingPath ?? null,
      attributionGclid: dto.attribution?.gclid ?? null,
      attributionFbclid: dto.attribution?.fbclid ?? null,
      attributionMsclkid: dto.attribution?.msclkid ?? null,
      attributionCapturedAt: dto.attribution?.capturedAt
        ? new Date(dto.attribution.capturedAt)
        : null,
      status: 'pending',
    });

    const saved = await this.bookings.save(booking);

    // Fire both emails; mark emailsSent only if both succeed.
    const [notifyOk, confirmOk] = await Promise.all([
      this.resend.send({
        to: this.notifyEmail,
        subject: `New booking — ${saved.tourTitle} (${saved.customerName})`,
        html: this.buildNotificationEmail(saved),
        replyTo: saved.customerEmail,
      }),
      this.resend.send({
        to: saved.customerEmail,
        subject: `Your Enduro Brothers booking — ${saved.tourTitle}`,
        html: this.buildConfirmationEmail(saved),
        replyTo: this.notifyEmail,
      }),
    ]);

    if (notifyOk && confirmOk) {
      saved.emailsSent = true;
      await this.bookings.save(saved);
    } else {
      this.logger.warn(
        `Booking ${saved.id} saved but emails incomplete (notify=${notifyOk}, confirm=${confirmOk})`,
      );
    }

    return saved;
  }

  /**
   * Admin-only: transition a booking's lifecycle status. Drives the timestamp
   * columns automatically — `completed` stamps tourCompletedAt, `cancelled`
   * stamps cancelledAt, `pending` clears both, `no-show` clears neither
   * (no-show keeps tourCompletedAt null because no tour was completed).
   */
  async setStatus(
    id: string,
    status: 'pending' | 'completed' | 'no-show' | 'cancelled',
    timestamp: Date = new Date(),
  ): Promise<Booking> {
    const booking = await this.bookings.findOne({ where: { id } });
    if (!booking) throw new Error(`Booking ${id} not found`);
    booking.status = status;
    if (status === 'completed') {
      booking.tourCompletedAt = timestamp;
      booking.cancelledAt = null;
    } else if (status === 'cancelled') {
      booking.cancelledAt = timestamp;
      booking.tourCompletedAt = null;
    } else if (status === 'pending') {
      booking.tourCompletedAt = null;
      booking.cancelledAt = null;
    }
    // 'no-show' leaves both timestamps as-is (typically already null).
    return this.bookings.save(booking);
  }

  /** Admin-only: full booking list, newest first. No pagination — current
   *  volume comfortably fits on one screen and absolute transparency is the
   *  point of the page. Revisit if rows exceed ~500. */
  findAllForAdmin(): Promise<Booking[]> {
    return this.bookings.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Admin-only commission report. Returns attributable revenue + commission
   * owed across the date range, plus a per-channel breakdown so we can see
   * which channels are actually paying out. Only completed bookings count —
   * the commission deal pays after the tour runs, not on the deposit.
   *
   * `eligibleChannels` defaults to the SEO bucket ('organic-*' and 'ai-*'),
   * matching the 3% partnership scope. Pass [] to count every channel.
   */
  async getCommissionSummary(
    from: Date,
    to: Date,
    rate: number,
    eligibleChannels: string[] = ['organic-', 'ai-'],
  ): Promise<{
    from: string;
    to: string;
    rate: number;
    totalCompletedRevenue: number;
    attributableRevenue: number;
    commissionOwed: number;
    completedCount: number;
    attributableCount: number;
    byChannel: Array<{ channel: string; count: number; revenue: number; commission: number }>;
  }> {
    const completed = await this.bookings
      .createQueryBuilder('b')
      .where('b.status = :status', { status: 'completed' })
      .andWhere('b."tourCompletedAt" BETWEEN :from AND :to', { from, to })
      .getMany();

    const isEligible = (channel: string | null): boolean => {
      if (!channel) return false;
      if (eligibleChannels.length === 0) return true;
      return eligibleChannels.some((prefix) => channel.startsWith(prefix));
    };

    let totalCompletedRevenue = 0;
    let attributableRevenue = 0;
    let attributableCount = 0;
    const channelBuckets = new Map<string, { count: number; revenue: number }>();

    for (const b of completed) {
      const amount = Number(b.depositAmount);
      totalCompletedRevenue += amount;
      const channel = b.attributionChannel || '(none)';
      const bucket = channelBuckets.get(channel) ?? { count: 0, revenue: 0 };
      bucket.count += 1;
      bucket.revenue += amount;
      channelBuckets.set(channel, bucket);
      if (isEligible(b.attributionChannel)) {
        attributableRevenue += amount;
        attributableCount += 1;
      }
    }

    const byChannel = Array.from(channelBuckets.entries())
      .map(([channel, b]) => ({
        channel,
        count: b.count,
        revenue: Number(b.revenue.toFixed(2)),
        commission: isEligible(channel) ? Number((b.revenue * rate).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      rate,
      totalCompletedRevenue: Number(totalCompletedRevenue.toFixed(2)),
      attributableRevenue: Number(attributableRevenue.toFixed(2)),
      commissionOwed: Number((attributableRevenue * rate).toFixed(2)),
      completedCount: completed.length,
      attributableCount,
      byChannel,
    };
  }

  /** Cache (process-memory) so /stats can be polled without hitting the DB. */
  private statsCache: BookingStats | null = null;
  private statsCacheExpiry = 0;

  /**
   * Aggregated, public-safe booking signals for the social-proof badge and
   * the season-filling line. Quota-gated: under-threshold values return null
   * so the frontend never renders a deflating "1 rider booked" message.
   */
  async getStats(): Promise<BookingStats> {
    const now = Date.now();
    if (this.statsCache && now < this.statsCacheExpiry) return this.statsCache;

    // Recent RIDERS: sum numberOfRiders (not row count) for the last 30 days.
    // A group of 6 counts as 6 — that matches the "X riders booked" copy.
    const since = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const recentRow = await this.bookings
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b."numberOfRiders"), 0)::int', 'sum')
      .where('b."createdAt" >= :since', { since })
      .getRawOne<{ sum: number }>();
    const recent = Number(recentRow?.sum ?? 0);

    // Popular upcoming month: sum riders by year-month of startDate, pick the
    // biggest bucket among months that are today or later. Same headcount-not-
    // rowcount logic so "July is filling up fast" reflects real demand.
    // When ≤10 days remain in the current month, push the floor to the 1st of
    // next month — "May is filling up fast — reserve early" on May 24 reads as
    // a season-ending message rather than urgency, since there's no realistic
    // booking window left.
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = lastDay - today.getDate();
    const floor = daysRemaining <= 10
      ? new Date(today.getFullYear(), today.getMonth() + 1, 1)
      : today;
    const floorIso = floor.toISOString().slice(0, 10);
    const top = await this.bookings
      .createQueryBuilder('b')
      .select(`to_char(b."startDate", 'YYYY-MM')`, 'ym')
      .addSelect('COALESCE(SUM(b."numberOfRiders"), 0)::int', 'cnt')
      .where('b."startDate" IS NOT NULL')
      .andWhere('b."startDate" >= :floor', { floor: floorIso })
      .groupBy('ym')
      .orderBy('cnt', 'DESC')
      .limit(1)
      .getRawOne<{ ym: string; cnt: number }>();

    let popularMonth: BookingStats['popularMonth'] = null;
    if (top && Number(top.cnt) >= MONTH_MIN) {
      const [y, m] = top.ym.split('-').map(Number);
      popularMonth = { year: y, month: m, count: Number(top.cnt) };
    }

    const stats: BookingStats = {
      recentBookings: recent >= RECENT_MIN ? recent : null,
      popularMonth,
    };

    this.statsCache = stats;
    this.statsCacheExpiry = now + STATS_TTL_MS;
    return stats;
  }

  private escape(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private extrasHtml(extras: string[] | null): string {
    if (!extras || !extras.length) return 'None';
    return extras.map((e) => this.escape(e)).join('<br>');
  }

  /** Human label for the preferred contact method (resolves 'other'). */
  private contactLabel(b: Booking): string {
    const labels: Record<string, string> = {
      whatsapp: 'WhatsApp',
      phone: 'Phone call',
      email: 'Email',
    };
    if (b.preferredContact === 'other') {
      return b.preferredContactOther
        ? `Other — ${b.preferredContactOther}`
        : 'Other';
    }
    return labels[b.preferredContact] ?? b.preferredContact;
  }

  // ---------------------------------------------------------------------------
  // Email templates — kept inline-styled (CSS classes are unreliable in email
  // clients) and table-based (Outlook). Brand red #e10000 mirrors the site's
  // --brand-primary; we hardcode it because email can't read CSS variables.
  // ---------------------------------------------------------------------------

  private static readonly BRAND_PRIMARY = '#e10000';
  private static readonly BRAND_DARK = '#b00000';
  private static readonly TEXT_DARK = '#222222';
  private static readonly TEXT_MUTED = '#888888';
  private static readonly BG_PAGE = '#f4f4f4';
  private static readonly BG_CARD = '#ffffff';
  private static readonly ROW_DIVIDER = '#eeeeee';

  // Phone numbers mirror the values in src/environments/environment.ts. If
  // those ever change, update both. Kept here so emails don't depend on the
  // Angular runtime — and so the rider has a clickable tel: link in their
  // confirmation regardless of where they read the mail.
  private static readonly PHONE_UK = '+44 747 236 2817';
  private static readonly PHONE_BG = '+359 894 494 126';

  /** Reusable "reach us" block embedded in both emails. */
  private contactBlock(): string {
    const { BRAND_PRIMARY, PHONE_UK, PHONE_BG } = BookingsService;
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;background:#fff7f7;border-left:4px solid ${BRAND_PRIMARY};border-radius:6px;">
        <tr><td style="padding:14px 16px;">
          <div style="font-size:13px;color:${BookingsService.TEXT_MUTED};text-transform:uppercase;letter-spacing:0.5px;font-weight:700;margin-bottom:6px;">Reach us anytime</div>
          <div style="font-size:14px;line-height:1.7;color:${BookingsService.TEXT_DARK};">
            🇬🇧 UK: <a href="tel:${PHONE_UK.replace(/\s/g, '')}" style="color:${BRAND_PRIMARY};text-decoration:none;font-weight:600;">${PHONE_UK}</a><br>
            🇧🇬 BG: <a href="tel:${PHONE_BG.replace(/\s/g, '')}" style="color:${BRAND_PRIMARY};text-decoration:none;font-weight:600;">${PHONE_BG}</a><br>
            ✉️ <a href="mailto:info@endurobrothersbulgaria.com" style="color:${BRAND_PRIMARY};text-decoration:none;font-weight:600;">info@endurobrothersbulgaria.com</a>
          </div>
        </td></tr>
      </table>`;
  }

  /** Branded outer shell — header bar, white card, footer. */
  private emailShell(headline: string, bodyHtml: string, footerLine: string): string {
    const { BRAND_PRIMARY, BRAND_DARK, TEXT_DARK, TEXT_MUTED, BG_PAGE, BG_CARD } =
      BookingsService;
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <!-- Lock the email to light rendering so clients (Apple Mail / iOS) don't
       auto-invert the brand red header or muddy the white text in dark mode. -->
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    /* Outlook.com / Windows Mail force dark mode and rewrite colours via the
       data-ogsc (text) / data-ogsb (background) hooks — re-assert the brand
       header so it stays red-background, white-text everywhere. */
    [data-ogsb] .eb-header, [data-ogsc] .eb-header { background-color: ${BRAND_PRIMARY} !important; }
    [data-ogsc] .eb-header-title { color: #ffffff !important; }
    [data-ogsc] .eb-header-sub { color: #ffe7e7 !important; }
  </style>
</head>
<body style="margin:0;padding:0;background:${BG_PAGE};font-family:Arial,Helvetica,sans-serif;color:${TEXT_DARK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_PAGE};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BG_CARD};border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <!-- Brand header bar -->
        <tr><td class="eb-header" style="background:${BRAND_PRIMARY};background-image:linear-gradient(135deg,${BRAND_PRIMARY} 0%,${BRAND_DARK} 100%);padding:24px 32px;text-align:center;">
          <div class="eb-header-title" style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Enduro Brothers Bulgaria</div>
          <div class="eb-header-sub" style="color:#ffe7e7;font-size:13px;margin-top:4px;letter-spacing:0.5px;">${this.escape(headline)}</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px;color:${TEXT_DARK};font-size:15px;line-height:1.55;">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:18px 32px 24px;border-top:1px solid #eeeeee;text-align:center;color:${TEXT_MUTED};font-size:12px;">
          ${footerLine}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  }

  /** Two-column key/value row used inside both email bodies. */
  private detailRow(label: string, value: string): string {
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid ${BookingsService.ROW_DIVIDER};color:${BookingsService.TEXT_MUTED};font-size:13px;width:40%;">${this.escape(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${BookingsService.ROW_DIVIDER};color:${BookingsService.TEXT_DARK};font-weight:600;">${value}</td>
    </tr>`;
  }

  /** Internal email to the Enduro Brothers inbox. */
  private buildNotificationEmail(b: Booking): string {
    const { BRAND_PRIMARY } = BookingsService;
    const body = `
      <p style="margin:0 0 16px;">A rider just paid a deposit and submitted the booking form.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${this.detailRow('Tour', this.escape(b.tourTitle))}
        ${this.detailRow('Name', this.escape(b.customerName))}
        ${this.detailRow('Email', `<a href="mailto:${this.escape(b.customerEmail)}" style="color:${BRAND_PRIMARY};text-decoration:none;">${this.escape(b.customerEmail)}</a>`)}
        ${this.detailRow('Phone', `<a href="tel:${this.escape(b.customerPhone)}" style="color:${BRAND_PRIMARY};text-decoration:none;">${this.escape(b.customerPhone)}</a>`)}
        ${this.detailRow('Preferred contact', this.escape(this.contactLabel(b)))}
        ${this.detailRow('Riders', String(b.numberOfRiders))}
        ${this.detailRow('Experience', this.escape((b.experienceLevels || []).join(', ')))}
        ${this.detailRow('Preferred dates', this.escape(b.preferredDates))}
        ${this.detailRow('Extras', this.extrasHtml(b.extras))}
        ${this.detailRow('Deposit paid', `<span style="color:${BRAND_PRIMARY};font-weight:700;">${b.currency} ${b.depositAmount}</span>`)}
        ${this.detailRow('PayPal order', this.escape(b.paypalOrderId ?? '—'))}
        ${this.detailRow('Locale', this.escape(b.locale))}
        ${this.attributionRows(b)}
      </table>
      ${this.contactBlock()}`;
    return this.emailShell('New tour booking', body, `Booking ID: ${b.id}`);
  }

  /** Optional attribution block on the internal notification email. Shows the
   *  acquisition channel inline so SEO/AI-driven bookings are visible without
   *  opening the DB. Renders nothing for legacy rows that lack attribution. */
  private attributionRows(b: Booking): string {
    if (!b.attributionChannel && !b.attributionSource) return '';
    const channel = this.escape(b.attributionChannel ?? '—');
    const source = this.escape(b.attributionSource ?? '—');
    const campaign = b.attributionCampaign ? this.escape(b.attributionCampaign) : '—';
    const referrer = b.attributionReferrer ? this.escape(b.attributionReferrer) : '—';
    const landing = b.attributionLandingPath ? this.escape(b.attributionLandingPath) : '—';
    return [
      this.detailRow('Channel', `<strong>${channel}</strong>`),
      this.detailRow('Source', source),
      this.detailRow('Campaign', campaign),
      this.detailRow('Landing page', landing),
      this.detailRow('Referrer', referrer),
    ].join('');
  }

  /** Confirmation email to the rider. */
  private buildConfirmationEmail(b: Booking): string {
    const { BRAND_PRIMARY } = BookingsService;
    const body = `
      <h2 style="margin:0 0 12px;color:${BRAND_PRIMARY};font-size:22px;font-weight:800;">
        Thanks, ${this.escape(b.customerName)} — your deposit is confirmed!
      </h2>
      <p style="margin:0 0 18px;">
        We've received your deposit for <strong>${this.escape(b.tourTitle)}</strong> and our team will contact you within 24 hours to finalise the details.
      </p>
      <h3 style="margin:24px 0 12px;color:${BRAND_PRIMARY};font-size:16px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Your booking</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${this.detailRow('Tour', this.escape(b.tourTitle))}
        ${this.detailRow('Riders', String(b.numberOfRiders))}
        ${this.detailRow('Experience level', this.escape((b.experienceLevels || []).join(', ')))}
        ${this.detailRow('Preferred dates', this.escape(b.preferredDates))}
        ${this.detailRow('Extras', this.extrasHtml(b.extras))}
        ${this.detailRow('Deposit paid', `<span style="color:${BRAND_PRIMARY};font-weight:700;">${b.currency} ${b.depositAmount}</span>`)}
      </table>
      ${this.contactBlock()}
      <p style="margin:24px 0 0;">
        See you on the trails,<br>
        <strong style="color:${BRAND_PRIMARY};">The Enduro Brothers team</strong>
      </p>`;
    return this.emailShell(
      'Your booking is confirmed',
      body,
      `Booking reference: ${b.id}`,
    );
  }
}
