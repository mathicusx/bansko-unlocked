import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * A confirmed booking enquiry captured by the tour-detail checkout flow.
 *
 * A row is created the moment PayPal captures the deposit (see
 * BookingsService.create). Persisting first means the booking is never lost
 * even if the Resend email send fails afterwards — the admin can always
 * recover it from this table or cross-reference PayPal by `paypalOrderId`.
 */
@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- Tour ---
  @Column({ type: 'varchar', nullable: true })
  tourId: string | null;

  @Column({ type: 'varchar', nullable: true })
  tourSlug: string | null;

  @Column()
  tourTitle: string;

  // --- Rider-supplied details (the pre-booking questionnaire) ---
  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column()
  customerPhone: string;

  // How the rider prefers to be contacted. 'other' pairs with a free-text
  // value stored in `preferredContactOther`.
  @Column({ type: 'varchar', length: 20 })
  preferredContact: 'whatsapp' | 'phone' | 'email' | 'other';

  @Column({ type: 'varchar', nullable: true })
  preferredContactOther: string | null;

  // One or more levels — a group can be mixed (e.g. beginner + advanced).
  // Stored as a comma-joined text column via simple-array.
  @Column('simple-array')
  experienceLevels: string[];

  @Column('int')
  numberOfRiders: number;

  @Column()
  preferredDates: string;

  // Structured copies of the date-range picker output. `preferredDates`
  // remains the human-readable label used in emails; these two are what
  // booking-stats aggregations (e.g. "most-requested upcoming month") read.
  @Column({ type: 'date', nullable: true })
  startDate: string | null;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  // Free-form list of selected add-ons, e.g. ['New tires (+€75/bike)'].
  @Column('simple-array', { nullable: true })
  extras: string[] | null;

  // --- Payment ---
  @Column('decimal', { precision: 10, scale: 2 })
  depositAmount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'varchar', nullable: true })
  paypalOrderId: string | null;

  // --- Context ---
  @Column({ type: 'varchar', length: 5, default: 'en' })
  locale: string;

  // True once both notification + confirmation emails were dispatched OK.
  @Column({ default: false })
  emailsSent: boolean;

  // --- First-touch attribution ---
  // Populated from the AttributionDto sent by the Angular AttributionService.
  // All nullable because (a) older app versions won't send them, (b) bots and
  // direct-API hits won't either. `attributionChannel` is the queryable bucket
  // for commission reports (e.g. SUM(depositAmount) WHERE channel LIKE 'ai-%').
  @Column({ type: 'varchar', length: 40, nullable: true })
  attributionChannel: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  attributionSource: string | null;

  @Column({ type: 'varchar', length: 60, nullable: true })
  attributionMedium: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  attributionCampaign: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  attributionReferrer: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  attributionLandingPath: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  attributionGclid: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  attributionFbclid: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  attributionMsclkid: string | null;

  @Column({ type: 'timestamp', nullable: true })
  attributionCapturedAt: Date | null;

  // Set by the admin once the rider has actually completed their tour.
  // Used as the commission trigger — only completed bookings are commissioned,
  // so cancellations/no-shows never flow through to the rev-share calculation.
  @Column({ type: 'timestamp', nullable: true })
  tourCompletedAt: Date | null;

  // Lifecycle: pending → completed | no-show | cancelled. The status string is
  // the queryable field for the admin table + commission summary; the timestamps
  // above (tourCompletedAt) and below (cancelledAt) record *when* the transition
  // happened, for audit. `no-show` deliberately has no separate timestamp — it's
  // a same-day decision on the tour start date.
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'completed' | 'no-show' | 'cancelled';

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
