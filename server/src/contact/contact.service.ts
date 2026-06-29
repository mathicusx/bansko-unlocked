import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResendService } from '../email/resend.service';
import { CreateContactDto } from './dto/create-contact.dto';

type Locale = 'en' | 'de' | 'fr' | 'nl';

/**
 * Localised copy for the customer-facing confirmation email. The internal
 * notification email is always English — it's read by the team, not by the
 * visitor.
 */
const CONFIRMATION_COPY: Record<Locale, {
  subject: string;
  headline: string;
  greeting: (name: string) => string;
  intro: string;
  yourMessageLabel: string;
  closingLine: string;
  signoff: string;
  signoffTeam: string;
  reachUs: string;
  footerLine: string;
}> = {
  en: {
    subject: "We've received your message — Enduro Brothers Bulgaria",
    headline: "We've received your message",
    greeting: (name) => `Thanks, ${name}!`,
    intro: "Your message just landed in our inbox. A real human from the team will get back to you within 24 hours — usually a lot faster.",
    yourMessageLabel: 'Your message',
    closingLine: "In the meantime, feel free to reach us directly on any of the channels below.",
    signoff: 'See you on the trails,',
    signoffTeam: 'The Enduro Brothers team',
    reachUs: 'Reach us anytime',
    footerLine: 'Enduro Brothers Bulgaria — premium enduro tours in Bansko & the Pirin mountains',
  },
  de: {
    subject: 'Wir haben deine Nachricht erhalten — Enduro Brothers Bulgaria',
    headline: 'Wir haben deine Nachricht erhalten',
    greeting: (name) => `Danke, ${name}!`,
    intro: 'Deine Nachricht ist in unserem Postfach gelandet. Jemand aus dem Team meldet sich innerhalb von 24 Stunden bei dir — in der Regel viel schneller.',
    yourMessageLabel: 'Deine Nachricht',
    closingLine: 'In der Zwischenzeit kannst du uns auch direkt über einen der Kanäle unten erreichen.',
    signoff: 'Bis bald auf den Trails,',
    signoffTeam: 'Dein Enduro Brothers Team',
    reachUs: 'So erreichst du uns',
    footerLine: 'Enduro Brothers Bulgaria — Premium-Enduro-Touren in Bansko und im Pirin-Gebirge',
  },
  fr: {
    subject: 'Nous avons bien reçu ton message — Enduro Brothers Bulgaria',
    headline: 'Nous avons bien reçu ton message',
    greeting: (name) => `Merci, ${name} !`,
    intro: "Ton message vient d'arriver dans notre boîte mail. Une vraie personne de l'équipe te répondra sous 24 heures — souvent bien plus vite.",
    yourMessageLabel: 'Ton message',
    closingLine: "En attendant, n'hésite pas à nous joindre directement sur l'un des canaux ci-dessous.",
    signoff: 'À bientôt sur les sentiers,',
    signoffTeam: "L'équipe Enduro Brothers",
    reachUs: 'Joins-nous à tout moment',
    footerLine: 'Enduro Brothers Bulgaria — tours enduro premium à Bansko et dans les montagnes du Pirin',
  },
  nl: {
    subject: 'We hebben je bericht ontvangen — Enduro Brothers Bulgaria',
    headline: 'We hebben je bericht ontvangen',
    greeting: (name) => `Bedankt, ${name}!`,
    intro: 'Je bericht is zojuist in onze inbox geland. Iemand van het team neemt binnen 24 uur contact met je op — meestal veel sneller.',
    yourMessageLabel: 'Je bericht',
    closingLine: 'In de tussentijd kun je ons ook direct bereiken via een van de kanalen hieronder.',
    signoff: 'Tot snel op de trails,',
    signoffTeam: 'Het Enduro Brothers team',
    reachUs: 'Bereik ons wanneer je wilt',
    footerLine: 'Enduro Brothers Bulgaria — premium enduro-reizen in Bansko en het Pirin-gebergte',
  },
};

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly notifyEmail: string;

  constructor(
    private readonly resend: ResendService,
    private readonly config: ConfigService,
  ) {
    // Re-uses BOOKING_NOTIFY_EMAIL so contact messages land in the same staff
    // inbox as bookings — no extra env var to set up per environment.
    this.notifyEmail =
      this.config.get<string>('BOOKING_NOTIFY_EMAIL') ||
      'info@endurobrothersbulgaria.com';
  }

  /**
   * Fire the internal notification + the customer confirmation in parallel.
   * Returns true if BOTH emails were dispatched OK. The caller can decide how
   * to surface partial-failure to the visitor.
   */
  async submit(dto: CreateContactDto): Promise<{ ok: boolean; notifyOk: boolean; confirmOk: boolean }> {
    const locale: Locale = (dto.locale as Locale) ?? 'en';
    const source = dto.source ?? 'contact-page';

    const [notifyOk, confirmOk] = await Promise.all([
      this.resend.send({
        to: this.notifyEmail,
        subject: `New contact form — ${dto.name} (${source})`,
        html: this.buildNotificationEmail(dto, source),
        replyTo: dto.email,
      }),
      this.resend.send({
        to: dto.email,
        subject: CONFIRMATION_COPY[locale].subject,
        html: this.buildConfirmationEmail(dto, locale),
        replyTo: this.notifyEmail,
      }),
    ]);

    if (!(notifyOk && confirmOk)) {
      this.logger.warn(
        `Contact form emails incomplete (notify=${notifyOk}, confirm=${confirmOk}, email=${dto.email})`,
      );
    }

    return { ok: notifyOk && confirmOk, notifyOk, confirmOk };
  }

  // ---------------------------------------------------------------------------
  // Email rendering — table-based + inline styles (CSS classes are unreliable
  // in email clients) and matches the bookings shell so both surfaces share
  // one branded look. Hardcoded #e10000 mirrors --brand-primary; email can't
  // read CSS variables.
  // ---------------------------------------------------------------------------

  private static readonly BRAND_PRIMARY = '#e10000';
  private static readonly BRAND_DARK = '#b00000';
  private static readonly TEXT_DARK = '#222222';
  private static readonly TEXT_MUTED = '#888888';
  private static readonly BG_PAGE = '#f4f4f4';
  private static readonly BG_CARD = '#ffffff';
  private static readonly ROW_DIVIDER = '#eeeeee';
  private static readonly PHONE_UK = '+44 747 236 2817';
  private static readonly PHONE_BG = '+359 894 494 126';

  private escape(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /** Preserve paragraph breaks the visitor typed into the textarea. */
  private formatMessage(message: string): string {
    return this.escape(message).replace(/\r?\n/g, '<br>');
  }

  private contactBlock(reachUsLabel: string): string {
    const { BRAND_PRIMARY, PHONE_UK, PHONE_BG, TEXT_DARK, TEXT_MUTED } = ContactService;
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;background:#fff7f7;border-left:4px solid ${BRAND_PRIMARY};border-radius:6px;">
        <tr><td style="padding:14px 16px;">
          <div style="font-size:13px;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:0.5px;font-weight:700;margin-bottom:6px;">${this.escape(reachUsLabel)}</div>
          <div style="font-size:14px;line-height:1.7;color:${TEXT_DARK};">
            🇬🇧 UK: <a href="tel:${PHONE_UK.replace(/\s/g, '')}" style="color:${BRAND_PRIMARY};text-decoration:none;font-weight:600;">${PHONE_UK}</a><br>
            🇧🇬 BG: <a href="tel:${PHONE_BG.replace(/\s/g, '')}" style="color:${BRAND_PRIMARY};text-decoration:none;font-weight:600;">${PHONE_BG}</a><br>
            ✉️ <a href="mailto:info@endurobrothersbulgaria.com" style="color:${BRAND_PRIMARY};text-decoration:none;font-weight:600;">info@endurobrothersbulgaria.com</a>
          </div>
        </td></tr>
      </table>`;
  }

  private emailShell(headline: string, bodyHtml: string, footerLine: string): string {
    const { BRAND_PRIMARY, BRAND_DARK, TEXT_DARK, TEXT_MUTED, BG_PAGE, BG_CARD } = ContactService;
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root { color-scheme: light; supported-color-schemes: light; }
    [data-ogsb] .eb-header, [data-ogsc] .eb-header { background-color: ${BRAND_PRIMARY} !important; }
    [data-ogsc] .eb-header-title { color: #ffffff !important; }
    [data-ogsc] .eb-header-sub { color: #ffe7e7 !important; }
  </style>
</head>
<body style="margin:0;padding:0;background:${BG_PAGE};font-family:Arial,Helvetica,sans-serif;color:${TEXT_DARK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG_PAGE};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BG_CARD};border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr><td class="eb-header" style="background:${BRAND_PRIMARY};background-image:linear-gradient(135deg,${BRAND_PRIMARY} 0%,${BRAND_DARK} 100%);padding:24px 32px;text-align:center;">
          <div class="eb-header-title" style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">Enduro Brothers Bulgaria</div>
          <div class="eb-header-sub" style="color:#ffe7e7;font-size:13px;margin-top:4px;letter-spacing:0.5px;">${this.escape(headline)}</div>
        </td></tr>
        <tr><td style="padding:28px 32px;color:${TEXT_DARK};font-size:15px;line-height:1.55;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 32px 24px;border-top:1px solid #eeeeee;text-align:center;color:${TEXT_MUTED};font-size:12px;">
          ${this.escape(footerLine)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  }

  private detailRow(label: string, value: string): string {
    const { ROW_DIVIDER, TEXT_DARK, TEXT_MUTED } = ContactService;
    return `<tr>
      <td style="padding:10px 0;border-bottom:1px solid ${ROW_DIVIDER};color:${TEXT_MUTED};font-size:13px;width:40%;vertical-align:top;">${this.escape(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${ROW_DIVIDER};color:${TEXT_DARK};font-weight:600;">${value}</td>
    </tr>`;
  }

  /** Internal staff notification — always English. */
  private buildNotificationEmail(dto: CreateContactDto, source: string): string {
    const { BRAND_PRIMARY } = ContactService;
    const sourceLabel = source === 'floating-help' ? 'Floating help bubble' : 'Contact page';
    const body = `
      <p style="margin:0 0 16px;">A visitor just sent a message through the <strong>${this.escape(sourceLabel)}</strong>.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${this.detailRow('Name', this.escape(dto.name))}
        ${this.detailRow('Email', `<a href="mailto:${this.escape(dto.email)}" style="color:${BRAND_PRIMARY};text-decoration:none;">${this.escape(dto.email)}</a>`)}
        ${this.detailRow('Locale', this.escape(dto.locale ?? 'en'))}
        ${this.detailRow('Source', this.escape(sourceLabel))}
        ${this.detailRow('Message', this.formatMessage(dto.message))}
      </table>
      <p style="margin:20px 0 0;color:#666;font-size:13px;">Reply directly to this email — the visitor's address is set as the reply-to.</p>`;
    return this.emailShell('New contact-form message', body, `From ${dto.email}`);
  }

  /** Customer-facing confirmation — locale-aware. */
  private buildConfirmationEmail(dto: CreateContactDto, locale: Locale): string {
    const { BRAND_PRIMARY } = ContactService;
    const copy = CONFIRMATION_COPY[locale];
    const body = `
      <h2 style="margin:0 0 12px;color:${BRAND_PRIMARY};font-size:22px;font-weight:800;">
        ${this.escape(copy.greeting(dto.name))}
      </h2>
      <p style="margin:0 0 18px;">${this.escape(copy.intro)}</p>
      <h3 style="margin:24px 0 12px;color:${BRAND_PRIMARY};font-size:16px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${this.escape(copy.yourMessageLabel)}</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fafafa;border-radius:6px;">
        <tr><td style="padding:14px 16px;color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap;">${this.formatMessage(dto.message)}</td></tr>
      </table>
      <p style="margin:20px 0 0;">${this.escape(copy.closingLine)}</p>
      ${this.contactBlock(copy.reachUs)}
      <p style="margin:24px 0 0;">
        ${this.escape(copy.signoff)}<br>
        <strong style="color:${BRAND_PRIMARY};">${this.escape(copy.signoffTeam)}</strong>
      </p>`;
    return this.emailShell(copy.headline, body, copy.footerLine);
  }
}
