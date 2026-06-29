import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export interface TourDay {
  day: number;
  title: string;
  description: string;
  image: string;
}

@Entity('tours')
export class Tour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Public URL slug. Nullable on the column so legacy rows can be backfilled at
  // startup (see ToursService.onModuleInit); new rows always get one assigned.
  @Index({ unique: true, where: 'slug IS NOT NULL' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  slug: string | null;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'varchar', length: 10 })
  type: 'enduro' | 'buggy';

  @Column('decimal', { precision: 10, scale: 2 })
  priceEur: number;

  @Column('decimal', { precision: 10, scale: 2 })
  priceGbp: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  promoPriceEur: number | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  promoPriceGbp: number | null;

  @Column({ type: 'varchar', nullable: true })
  promoEndDate: string | null;

  // Human-readable label for the booking period the promo covers,
  // e.g. "July" or "July–August". Drives the SERP-facing badge wording;
  // promoEndDate still controls whether the promo is active.
  @Column({ type: 'varchar', length: 100, nullable: true })
  promoBookingPeriod: string | null;

  @Column({ type: 'varchar', nullable: true })
  promo: string | null;

  @Column()
  image: string;

  @Column()
  duration: string;

  @Column()
  durationDetails: string;

  @Column()
  averageDistance: string;

  @Column('simple-array')
  difficulty: string[];

  @Column('jsonb')
  tourDetails: TourDay[];

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
