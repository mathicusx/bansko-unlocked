// Single source of truth for customer reviews.
//
// Adding or removing an entry below auto-updates:
//   - ReviewsComponent (carousel + page) via direct import
//   - The brand-level aggregateRating + Review[] entities Google sees, via
//     SeoService.getAggregateRatingSchema, which derives ratingValue +
//     reviewCount from this array at runtime and merges into the canonical
//     #travel-agency entity declared in src/index.html.
//
// Ordered newest-first by `date`. When adding a new review, insert it at
// the top (or near the top, in month order) so the carousel and /reviews
// page show recent reviews first.
//
// Do NOT hardcode the count anywhere else.

export interface ReviewData {
  name: string;
  text: string;
  rating: number;
  date: string;
  location: string;
  avatar?: string;
  // When the review text identifies a specific tour (e.g. "3 days riding",
  // "an amazing week"), attribute it to that tour's slug. Reviews without a
  // tourSlug stay brand-only — they feed the TravelAgency aggregateRating but
  // not any per-tour TouristTrip aggregateRating. Don't guess: if the review
  // doesn't self-identify and you don't recall from booking records which
  // tour the customer took, leave tourSlug undefined.
  tourSlug?: string;
}

export const REVIEWS: ReviewData[] = [
  // Empty for the Bansko Unlocked launch — add real customer reviews here.
];

export const REVIEW_COUNT = REVIEWS.length;

// Average rating across all reviews, formatted the same way as the static
// JSON-LD in src/index.html (no trailing `.0`). Used by per-tour rich result
// schemas so they stay in sync with the brand-level AggregateRating that
// the prebuild script templates into index.html.
export const RATING_VALUE = (() => {
  if (REVIEWS.length === 0) return '0';
  const sum = REVIEWS.reduce((acc, r) => acc + r.rating, 0);
  return (sum / REVIEWS.length).toFixed(1).replace(/\.0$/, '');
})();

const MONTH_MAP: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3,
  May: 4, June: 5, July: 6, August: 7,
  September: 8, October: 9, November: 10, December: 11,
};

// Parses 'Month YYYY' strings stored on each review into a real Date.
// Day defaults to the 1st — review dates are approximated to the month they
// were mirrored from Facebook, since exact day-precision isn't tracked here.
function parseReviewDate(s: string): Date {
  const [month, year] = s.split(' ');
  return new Date(parseInt(year, 10), MONTH_MAP[month] ?? 0, 1);
}

// Shape consumed by SeoService.getAggregateRatingSchema. Centralized so both
// the /reviews page and the homepage produce identical schema content.
export function getReviewsForSchema() {
  return REVIEWS.map((review) => ({
    rating: review.rating,
    author: review.name,
    reviewBody: review.text,
    date: parseReviewDate(review.date),
  }));
}

// Returns the subset of reviews attributable to a specific tour (matched by
// slug). Used by tour-detail pages to emit a per-tour TouristTrip aggregateRating
// — the only schema type Google renders as organic ★ snippets (brand-level
// AggregateRating on TravelAgency is filtered as self-serving). Reviews
// without a tourSlug stay brand-level and are excluded here.
export function getReviewsForTour(tourSlug: string) {
  return REVIEWS
    .filter((review) => review.tourSlug === tourSlug)
    .map((review) => ({
      rating: review.rating,
      author: review.name,
      reviewBody: review.text,
      date: parseReviewDate(review.date),
    }));
}
