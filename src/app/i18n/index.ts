import { en } from './en';
import type { Locale } from '../services/locale.service';

/**
 * Page meta block. Every static page that supports DE owns one of these.
 * `url` is intentionally absent here — it's built at runtime from
 * `LocaleService.canonicalFor(neutralPath, locale)` so we can't accidentally
 * hardcode a wrong canonical (past bug: hardcoded /de/booking URLs in dormant
 * dicts that didn't match the actual /de/enduro-tours route).
 */
export interface PageMeta {
  title: string;
  description: string;
  keywords: string;
}

export interface HeroMessage {
  title: string;
  subtitle: string;
}

export interface FeatureCard {
  title: string;
  body: string;
  /** `alt` for the card's illustrative image. */
  imageAlt: string;
}

export interface HomePageCopy {
  seoH1: string;
  /** Decorative hero media — image `alt` + the `<video>` no-support fallback. */
  media: {
    videoFallback: string;
    heroImageAlt: string;
  };
  heroMessages: HeroMessage[];
  buttons: {
    bookAdventure: string;
    buggyPrompt: string;
    bookBuggy: string;
  };
  whyChooseUs: {
    heading: string;
    intro: string;
    features: FeatureCard[];
  };
  /** Top-3 FAQ embedded in the homepage JSON-LD. Translated copies feed the
   *  FAQPage @graph node so DE SERP snippets render German Q&A. */
  faqSchema: Array<{ question: string; answer: string }>;
  /** "From the Trail" blog teaser shown low on the homepage (between Reviews
   *  and FAQ). Posts themselves come from the locale's blog-posts data. */
  blog: {
    heading: string;
    lede: string;
    readMore: string;
    allPosts: string;
  };
}

export interface FaqQA {
  question: string;
  answer: string;
}

export interface FaqPageCopy {
  heading: string;
  intro: string;
  /** Q&A pairs. `answer` may contain trusted inline HTML (`<br>`, `<strong>`,
   *  `<a href>`) — rendered via `[innerHTML]`. */
  items: FaqQA[];
}

export interface ReviewsPageCopy {
  heading: string;
  intro: string;
  readMore: string;
  readLess: string;
  swipeHint: string;
  moreReviewsPrompt: string;
  facebookCta: string;
  googleCta: string;
  previousAria: string;
  nextAria: string;
}

export interface IncludedItem {
  text: string;
}

export interface EnduroToursPageCopy {
  heading: string;
  intro: string;
  loading: string;
  specialOffer: string;
  validForPeriod: string;
  endsDate: string;
  priceDivider: string;
  perUnit: string;
  viewDetails: string;
  viewAll: string;
  /** Homepage-only label shown under the section heading above the curated
   *  "most popular" tour teaser. Hidden on the full /enduro-tours listing. */
  mostPopular: string;
  whatsIncluded: string;
  includedItems: IncludedItem[];
  /** Admin-only labels. Surfaced only when a logged-in admin views the page,
   *  so translation parity matters less — but we keep them consistent. */
  admin: {
    addNew: string;
    edit: string;
    delete: string;
    confirmDelete: (title: string) => string;
    failedDelete: string;
    failedCreate: string;
  };
}

export interface BuggyToursPageCopy {
  heading: string;
  intro: string;
  loading: string;
  specialOffer: string;
  validForPeriod: string;
  endsDate: string;
  priceDivider: string;
  perUnit: string;
  viewDetails: string;
  viewAll: string;
  whatsIncluded: string;
  includedItems: IncludedItem[];
  includedTagline: string;
  admin: {
    addNew: string;
    edit: string;
    delete: string;
    confirmDelete: (title: string) => string;
    failedDelete: string;
    failedCreate: string;
  };
}

export interface AboutStat {
  /** Big number — locale-invariant (e.g. "1000+", "3", "999+"). */
  number: string;
  label: string;
}

export interface AboutAchievement {
  /** Emoji — locale-invariant. */
  icon: string;
  text: string;
}

export interface AboutPageCopy {
  h1: string;
  story: {
    heading: string;
    /** Body paragraphs — may carry trusted inline HTML (`<strong>`),
     *  rendered via `[innerHTML]`. */
    paragraphs: string[];
    imageAlt: string;
  };
  stats: {
    heading: string;
    items: AboutStat[];
  };
  playground: {
    heading: string;
    imageAlt: string;
    paragraphs: string[];
    /** Highlight box — inline HTML (`<strong>`). */
    didYouKnow: string;
  };
  founder: {
    heading: string;
    visionHeading: string;
    paragraphs: string[];
    quote: string;
    achievementsHeading: string;
    achievements: AboutAchievement[];
  };
  teamTeaser: {
    heading: string;
    lede: string;
    photoAlt: string;
    cta: string;
  };
  blog: {
    heading: string;
    lede: string;
    readMore: string;
    allPosts: string;
  };
  collection: {
    heading: string;
    description: string;
  };
  copyright: string;
}

export interface ContactPageCopy {
  h1: string;
  subtitle: string;
  form: {
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    send: string;
    sending: string;
    /** reCAPTCHA disclaimer — inline HTML with two links, `[innerHTML]`. */
    recaptchaNotice: string;
    nameRequired: string;
    nameMinLength: string;
    emailRequired: string;
    emailInvalid: string;
    messageRequired: string;
    messageMinLength: string;
    openingEmailClient: string;
    /** Success dialog heading after a successful POST to /api/contact. */
    messageSentTitle: string;
    /** Success dialog body. */
    messageSent: string;
    /** Error dialog heading when the send fails. */
    messageFailedTitle: string;
    /** Error dialog body. */
    messageFailed: string;
    fillFieldsCorrectly: string;
    snackbarClose: string;
  };
  directContact: {
    heading: string;
    intro1: string;
    intro2: string;
    whatsappButton: string;
    hurryText: string;
    phoneLabel: string;
    /** Phone link label — also passed to PhoneService.setupPhoneLink so the
     *  browser-side text matches the SSR text. Keeps the ☎ emoji. */
    clickToCall: string;
    emailLabel: string;
  };
  location: {
    heading: string;
    region: string;
    province: string;
    country: string;
    mapTitle: string;
  };
}

export interface TeamGuideCopy {
  portraitAlt: string;
  role: string;
  statLabel: string;
  bio: string;
  /** Optional pull-quote callout under the bio (Funi has none). */
  legend?: string;
  credentials: string[];
}

export interface TeamCtaCopy {
  label: string;
  title: string;
  meta: string;
}

export interface TeamPageCopy {
  h1: string;
  lede: string;
  groupPhotoAlt: string;
  specialitiesHeading: string;
  guides: {
    ibrahim: TeamGuideCopy;
    medy: TeamGuideCopy;
    funi: TeamGuideCopy;
    funiNice: TeamGuideCopy;
  };
  ares: {
    role: string;
    bio: string;
  };
  whyNamedGuides: {
    heading: string;
    body: string;
  };
  /** "Ride with the team" CTA block. The secondary paragraph is split into
   *  fragments so the two internal links keep `routerLink` (SPA nav) instead
   *  of being baked into an `[innerHTML]` string with plain `<a href>`. */
  rideWithUs: {
    heading: string;
    lede: string;
    newRiders: TeamCtaCopy;
    experiencedRiders: TeamCtaCopy;
    secondaryStart: string;
    enduroToursLink: string;
    secondaryMid: string;
    accommodationLink: string;
    secondaryEnd: string;
  };
}

/**
 * Copy for the tour-detail pre-booking checkout dialog. Step 1 collects the
 * rider's details (name/email/experience/group size/dates); step 2 shows a
 * summary + the PayPal deposit button; step 3 is the post-payment success
 * screen. All four locales must supply this block.
 */
export interface CheckoutCopy {
  /** Primary CTA on the pricing card that opens the dialog. */
  reserveButton: string;
  /** Secondary CTA — opens WhatsApp with a pre-filled English message. */
  whatsappCta: string;
  closeAria: string;
  /** Step 1 — details form. */
  title: string;
  subtitle: string;
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  phonePlaceholder: string;
  experienceLabel: string;
  experiencePlaceholder: string;
  experienceOptions: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  ridersLabel: string;
  /** Min-group hint under the riders field, e.g. "Minimum 4 riders per booking". */
  ridersHint: (min: number) => string;
  datesLabel: string;
  datesPlaceholder: string;
  dateStart: string;
  dateEnd: string;
  preferredContactLabel: string;
  contactOptions: {
    whatsapp: string;
    phone: string;
    email: string;
    other: string;
  };
  /** Free-text input shown when "Other" contact method is chosen. */
  contactOtherPlaceholder: string;
  extrasLabel: string;
  continueButton: string;
  emailInvalid: string;
  /** Step 2 — payment. */
  backButton: string;
  summaryTitle: string;
  summaryTour: string;
  summaryRiders: string;
  summaryExperience: string;
  summaryDates: string;
  summaryPhone: string;
  summaryContact: string;
  summaryExtras: string;
  paymentHeading: string;
  /** Reassurance tooltip shown on an info icon next to the payment heading —
   *  we never see or store card details; PayPal handles the payment. */
  securePaymentInfo: string;
  submitting: string;
  /** Step 3 — success. */
  successTitle: string;
  successBody: string;
  successClose: string;
  /** Shown if the booking POST fails after a successful payment. */
  emailFallback: string;
}

export interface TourDetailPageCopy {
  loading: string;
  detailsHeading: string;
  earlyBird: string;
  durationLabel: string;
  averageDistanceLabel: string;
  difficultyLabel: string;
  whatsIncluded: string;
  /** Fixed "What's Included" list — `icon` is a Material icon name. */
  includedItems: Array<{ icon: string; text: string }>;
  itineraryHeading: string;
  /** Word before the day number, e.g. "Day 2 - Riding Day". */
  dayLabel: string;
  pricingHeading: string;
  specialOffer: string;
  /** Builds "Valid for <period> bookings". */
  validForPeriod: (period: string) => string;
  perPerson: string;
  priceDivider: string;
  depositNotice: string;
  additionalOptions: string;
  newTires: string;
  newTiresPrice: string;
  /** Booking-instructions sentence, split around the inline email link
   *  (the `<a>` keeps an Angular click handler so it stays in the template). */
  bookingEmailIntro: string;
  bookingEmailOutro: string;
  /** Pre-booking checkout flow (the "Reserve this tour" dialog → PayPal). */
  checkout: CheckoutCopy;
  /** Truthful social-proof / season-filling lines on the pricing card and in
   *  the checkout dialog. Returns null upstream when quotas aren't met; copy
   *  here is only called when there's something real to say. */
  socialProof: {
    /** "12 riders booked in the last 30 days" — count is always above quota. */
    bookedRecently: (count: number) => string;
    /** "July is filling up fast — reserve early" — month is locale-formatted. */
    fillingFast: (month: string) => string;
  };
  requirementsHeading: string;
  requirements: Array<{ icon: string; title: string; body: string }>;
  reviewsHeading: string;
  starsAria: string;
  notFoundHeading: string;
  notFoundBody: string;
  backToTours: string;
  /** SEO meta builders — joined with per-tour data in `updateTourSEO`.
   *  The EN copies reproduce the long-standing format byte-for-byte. */
  seo: {
    title: (tourTitle: string, displayPrice: number, duration: string) => string;
    description: (
      tourDescription: string,
      isBeginner: boolean,
      duration: string,
      displayPrice: number,
      basePrice: number | null,
    ) => string;
    keywords: (
      tourTitle: string,
      duration: string,
      displayPrice: number,
      difficulty: string,
      isBeginner: boolean,
    ) => string;
  };
}

export interface BuggyTourDetailPageCopy {
  loading: string;
  detailsHeading: string;
  earlyBird: string;
  durationLabel: string;
  averageDistanceLabel: string;
  difficultyLabel: string;
  whatsIncluded: string;
  includedItems: Array<{ icon: string; text: string }>;
  includedTagline: string;
  itineraryHeading: string;
  dayLabel: string;
  pricingHeading: string;
  specialOffer: string;
  validForPeriod: (period: string) => string;
  perBuggy: string;
  priceDivider: string;
  depositNotice: string;
  bookingEmailIntro: string;
  bookingEmailOutro: string;
  requirementsHeading: string;
  requirements: Array<{ icon: string; title: string; body: string }>;
  faqHeading: string;
  faq: Array<{ question: string; answer: string }>;
  whyDifferentHeading: string;
  whyDifferentIntro: string;
  whyDifferentPoints: string[];
  whyDifferentTagline: string;
  notFoundHeading: string;
  notFoundBody: string;
  backToBuggyTours: string;
  seo: {
    title: (tourTitle: string, displayPrice: number, duration: string) => string;
    description: (
      tourDescription: string,
      duration: string,
      displayPrice: number,
      basePrice: number | null,
    ) => string;
    keywords: (tourTitle: string, duration: string, displayPrice: number) => string;
  };
}

/**
 * One difficulty tier on the /difficulty-levels page. The locale-invariant
 * fields (`key`, `badgeColor`, `image`, the recommended-tour slugs) live in
 * `DifficultyLevelsComponent` and are zipped onto this copy by array index —
 * keep the three `levels` entries ordered beginner → advanced → pro.
 */
export interface DifficultyLevelCopy {
  /** Tier label on the coloured pill — the translated Beginner/Advanced/Pro. */
  badge: string;
  title: string;
  oneLiner: string;
  description: string;
  terrainHeading: string;
  terrain: string[];
  riderHeading: string;
  rider: string[];
  recommendedHeading: string;
  /** Recommended tours, index-aligned with the slug list in the component.
   *  Tour names stay English (proper nouns); only `duration` is localised. */
  recommendedTours: Array<{ title: string; duration: string }>;
  imageAlt: string;
}

export interface DifficultyLevelsPageCopy {
  h1: string;
  /** Intro paragraph — carries inline `<strong>`, rendered via `[innerHTML]`. */
  intro: string;
  calibrate: {
    heading: string;
    /** Body paragraphs — inline `<strong>`, rendered via `[innerHTML]`. */
    paragraphs: string[];
  };
  /** Exactly three tiers, ordered beginner → advanced → pro. */
  levels: DifficultyLevelCopy[];
  bulgariaVsRest: {
    heading: string;
    paragraphs: string[];
  };
  faqHeading: string;
  faqs: FaqQA[];
  cta: {
    heading: string;
    body: string;
    primary: string;
    secondary: string;
  };
  /** Leaf label for the breadcrumb trail + `BreadcrumbList` schema. */
  breadcrumb: string;
}

/** A heading + body prose block — one per amenity section on /accommodation. */
export interface AccommodationSectionCopy {
  heading: string;
  body: string;
}

export interface AccommodationPageCopy {
  h1: string;
  /** Sub-heading line under the H1 ("OF ENDURO BROTHERS BULGARIA"). */
  subtitle: string;
  intro: string;
  /** `alt` text for every showcase image, keyed by slot. */
  imageAlts: {
    hotelExterior: string;
    hotelRoom: string;
    hotelLounge: string;
    dining1: string;
    dining2: string;
    dining3: string;
    poolIndoor: string;
    poolArea: string;
    poolFacilities: string;
    spaRelax: string;
    spaTreatment: string;
    jacuzzi: string;
    fitness: string;
  };
  dining: AccommodationSectionCopy;
  pool: AccommodationSectionCopy;
  spa: AccommodationSectionCopy;
  fitness: AccommodationSectionCopy;
}

export interface NavCopy {
  home: string;
  activities: string;
  /** @deprecated dormant — enduro/buggy itinerary nav (kept for revival). */
  enduroTours: string;
  /** @deprecated dormant. */
  buggyTours: string;
  about: string;
  contact: string;
  more: string;
  team: string;
  accommodation: string;
  gallery: string;
  blog: string;
  faq: string;
  themeLabel: string;
  /** Aria label for the mobile-menu hamburger button. */
  mobileMenuAria: string;
  /** Aria label for the desktop "more" menu chevron. */
  moreMenuAria: string;
}

export interface PromoBannerCopy {
  /** Lead text — e.g. "🔥 JULY SPECIAL DEAL". Plain string, no inline HTML. */
  leadHtml: string;
  /** Mid clause with a `{{ maxEur }}` / `{{ maxGbp }}` placeholder. */
  savingsTemplateEurOnly: string;
  savingsTemplateEurGbp: string;
  /** Trailing CTA — e.g. "— Click to View Tours!". */
  cta: string;
  closeAria: string;
}

export interface FooterCopy {
  facebookAria: string;
  instagramAria: string;
  youtubeAria: string;
  copyright: string;
}

export interface FloatingHelpCopy {
  callLabel: string;
  whatsappLabel: string;
  emailLabel: string;
  /** Persistent label shown on the collapsed help button. */
  contactPrompt: string;
}

export interface CountdownCopy {
  label: string;
  day: string;
  days: string;
  hr: string;
  hrs: string;
  min: string;
  sec: string;
  ended: string;
}

export interface LangToggleCopy {
  /** Aria label for the language-picker menu trigger. */
  menuAria: string;
}

export interface ThemeToggleCopy {
  /** Tooltip shown over the theme toggle button when the active theme is dark
   *  (clicking switches to light) and vice versa. */
  switchToLight: string;
  switchToDark: string;
  ariaLabel: string;
}

/**
 * Tier-name translations for the difficulty pills shown on every tour card
 * and detail page. Keys are the canonical English tier names — Beginner,
 * Advanced, Pro, Intermediate. Free-form tier strings authored in the admin
 * that don't match these keys fall back to their raw value (so a custom
 * "Expert" tag still renders, just not translated).
 */
export interface DifficultyCopy {
  beginner: string;
  advanced: string;
  pro: string;
  intermediate: string;
}

export interface Translations {
  meta: {
    home: PageMeta;
    enduroTours: PageMeta;
    about: PageMeta;
    contact: PageMeta;
    faq: PageMeta;
    reviews: PageMeta;
    team: PageMeta;
    difficultyLevels: PageMeta;
    accommodation: PageMeta;
  };
  pages: {
    home: HomePageCopy;
    faq: FaqPageCopy;
    reviews: ReviewsPageCopy;
    enduroTours: EnduroToursPageCopy;
    buggyTours: BuggyToursPageCopy;
    about: AboutPageCopy;
    contact: ContactPageCopy;
    team: TeamPageCopy;
    tourDetail: TourDetailPageCopy;
    buggyTourDetail: BuggyTourDetailPageCopy;
    difficultyLevels: DifficultyLevelsPageCopy;
    accommodation: AccommodationPageCopy;
  };
  chrome: {
    nav: NavCopy;
    promo: PromoBannerCopy;
    footer: FooterCopy;
    floatingHelp: FloatingHelpCopy;
    countdown: CountdownCopy;
    langToggle: LangToggleCopy;
    themeToggle: ThemeToggleCopy;
    difficulty: DifficultyCopy;
  };
}

const dictionaries: Record<Locale, Translations> = {
  en,
};

export function t(locale: Locale): Translations {
  return dictionaries[locale];
}

/**
 * Map a free-form difficulty tier string (as authored in the admin) to its
 * translated label for `locale`. Recognised keys are Beginner / Advanced /
 * Pro / Intermediate (case-insensitive). Any other value passes through
 * unchanged so custom tier tags still render.
 */
export function translateDifficulty(tier: string, locale: Locale): string {
  const copy = dictionaries[locale].chrome.difficulty;
  switch (tier.trim().toLowerCase()) {
    case 'beginner':
      return copy.beginner;
    case 'advanced':
      return copy.advanced;
    case 'pro':
      return copy.pro;
    case 'intermediate':
      return copy.intermediate;
    default:
      return tier;
  }
}
