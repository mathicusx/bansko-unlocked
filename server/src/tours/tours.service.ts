import { Inject, Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Tour } from './tour.entity';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

@Injectable()
export class ToursService implements OnModuleInit {
  private readonly logger = new Logger(ToursService.name);

  constructor(
    @InjectRepository(Tour)
    private toursRepo: Repository<Tour>,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  // Production runs with synchronize: false, so the slug column may not exist
  // yet on first deploy. Add it idempotently and backfill any null slugs from
  // their title so all rows have a working public URL.
  async onModuleInit() {
    try {
      await this.toursRepo.query(`ALTER TABLE tours ADD COLUMN IF NOT EXISTS slug varchar(255)`);
      await this.toursRepo.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_tours_slug ON tours(slug) WHERE slug IS NOT NULL`,
      );
      // Drafts. Added without a DB default so we can backfill pre-existing rows
      // to `true` (keep them live), while new rows from create() default to
      // `false` via the entity decorator.
      await this.toursRepo.query(`ALTER TABLE tours ADD COLUMN IF NOT EXISTS published boolean`);
      await this.toursRepo.query(`UPDATE tours SET published = true WHERE published IS NULL`);
      await this.toursRepo.query(`ALTER TABLE tours ALTER COLUMN published SET DEFAULT false`);
      await this.toursRepo.query(`ALTER TABLE tours ALTER COLUMN published SET NOT NULL`);
      // Free-text label for the booking window a promo covers (e.g. "July",
      // "July–August"). Nullable; front-end falls back to "Ends {promoEndDate}"
      // when unset.
      await this.toursRepo.query(`ALTER TABLE tours ADD COLUMN IF NOT EXISTS "promoBookingPeriod" varchar(100)`);
    } catch (err) {
      this.logger.warn(`Column bootstrap skipped: ${(err as Error).message}`);
      return;
    }

    const missing = await this.toursRepo.find({ where: { slug: IsNull() } });
    if (!missing.length) return;

    this.logger.log(`Backfilling slugs for ${missing.length} tour(s)`);
    for (const tour of missing) {
      tour.slug = await this.generateUniqueSlug(tour.title, tour.id);
      await this.toursRepo.save(tour);
    }
  }

  private async generateUniqueSlug(source: string, excludeId?: string): Promise<string> {
    const base = slugify(source) || 'tour';
    let candidate = base;
    let suffix = 1;
    while (true) {
      const existing = await this.toursRepo.findOne({ where: { slug: candidate } });
      if (!existing || existing.id === excludeId) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  async findAll(type?: string) {
    const key = type ? `tours:type:${type}` : 'tours:all';
    const cached = await this.cache.get<Tour[]>(key);
    if (cached) return cached;

    const tours = type
      ? await this.toursRepo.find({ where: { type: type as 'enduro' | 'buggy', published: true }, order: { createdAt: 'ASC' } })
      : await this.toursRepo.find({ where: { published: true }, order: { createdAt: 'ASC' } });

    await this.cache.set(key, tours);
    return tours;
  }

  // Admin-only listing — includes drafts. Not cached: admin reads are low
  // volume and we don't want stale draft state hanging around between edits.
  async findAllForAdmin() {
    return this.toursRepo.find({ order: { createdAt: 'ASC' } });
  }

  async findOneForAdmin(idOrSlug: string) {
    const isUuid = UUID_REGEX.test(idOrSlug);
    const tour = isUuid
      ? await this.toursRepo.findOne({ where: { id: idOrSlug } })
      : await this.toursRepo.findOne({ where: { slug: idOrSlug } });
    if (!tour) throw new NotFoundException('Tour not found');
    return tour;
  }

  async findOne(idOrSlug: string) {
    const isUuid = UUID_REGEX.test(idOrSlug);
    const key = `tours:${isUuid ? 'id' : 'slug'}:${idOrSlug}`;
    const cached = await this.cache.get<Tour>(key);
    if (cached) return cached;

    const tour = isUuid
      ? await this.toursRepo.findOne({ where: { id: idOrSlug, published: true } })
      : await this.toursRepo.findOne({ where: { slug: idOrSlug, published: true } });
    if (!tour) throw new NotFoundException('Tour not found');

    await this.cache.set(key, tour);
    return tour;
  }

  async create(dto: CreateTourDto) {
    const slug = await this.generateUniqueSlug(dto.slug || dto.title);
    const tour = this.toursRepo.create({ ...dto, slug });
    const saved = await this.toursRepo.save(tour);
    await this.invalidate(saved);
    return saved;
  }

  async update(id: string, dto: UpdateTourDto) {
    const tour = await this.toursRepo.findOne({ where: { id } });
    if (!tour) throw new NotFoundException('Tour not found');
    const previousSlug = tour.slug;
    Object.assign(tour, dto);
    // Honour an explicit slug from the admin; otherwise leave the existing slug
    // alone so renaming a title doesn't silently break indexed URLs.
    if (dto.slug && dto.slug !== previousSlug) {
      tour.slug = await this.generateUniqueSlug(dto.slug, id);
    }
    const saved = await this.toursRepo.save(tour);
    await this.invalidate(saved, previousSlug);
    return saved;
  }

  async remove(id: string) {
    const tour = await this.toursRepo.findOne({ where: { id } });
    if (!tour) throw new NotFoundException('Tour not found');
    const removed = await this.toursRepo.remove(tour);
    await this.invalidate(tour);
    return removed;
  }

  private async invalidate(tour: Pick<Tour, 'id' | 'slug'>, previousSlug?: string | null) {
    const keys = [
      'tours:all',
      'tours:type:enduro',
      'tours:type:buggy',
      `tours:id:${tour.id}`,
    ];
    if (tour.slug) keys.push(`tours:slug:${tour.slug}`);
    if (previousSlug && previousSlug !== tour.slug) keys.push(`tours:slug:${previousSlug}`);
    await Promise.all(keys.map((k) => this.cache.del(k)));
  }
}
