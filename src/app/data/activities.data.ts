/**
 * Bansko Unlocked activities — the static content model for the site's core
 * offering. Each entry renders:
 *   - a card in the home "Activities" grid + the /activities listing
 *   - a full landing page at /activities/:slug (ActivityComponent)
 *
 * This is hand-authored static data (no API / no DB). Add an activity by
 * appending an entry here and rerunning `npm run generate:sitemap` so the new
 * /activities/:slug URL lands in the sitemap + prerender set.
 *
 * NOTE: copy is solid placeholder text and every `heroImage`/`gallery` path
 * currently points at reused enduro-gallery photos — swap these for real
 * Bansko Unlocked photography (especially shooting-range + snow-riding) before
 * launch. `priceFrom` is an optional display string; omit it to hide pricing.
 */

export interface Activity {
  /** URL slug — the public identifier in /activities/:slug. Locked once indexed. */
  slug: string;
  /** Display name (card title + H1 leading keyword). */
  name: string;
  /** One-line hook shown on cards + under the hero H1. */
  tagline: string;
  /** Hero image (also the card image). */
  heroImage: string;
  /** Alt text for the hero/card image. */
  heroAlt: string;
  /** Supporting gallery images for the detail page. */
  gallery: { src: string; alt: string }[];
  /** Opening paragraph(s) of the detail page body. */
  intro: string;
  /** Bulleted selling points. */
  highlights: string[];
  /** "What to expect" prose. */
  whatToExpect: string;
  /** Practical "good to know" bullets (duration, who it's for, season, kit). */
  goodToKnow: string[];
  /** Optional "from €X" display string. Omit to hide pricing. */
  priceFrom?: string;
  /** Pre-filled enquiry subject for the WhatsApp / email CTAs. */
  enquirySubject: string;
  /** Per-page SEO meta. */
  seo: { title: string; description: string; keywords: string };
}

export const ACTIVITIES: Activity[] = [
  {
    slug: 'atv-buggy-tours',
    name: 'ATV & Buggy Tours',
    tagline: 'Off-road through the Pirin Mountains — no licence, all abilities.',
    heroImage: 'assets/enduro-gallery/enduro-22.jpg',
    heroAlt: 'Off-road buggy on a mountain trail near Bansko',
    gallery: [
      { src: 'assets/enduro-gallery/enduro-10.jpg', alt: 'Buggy crossing a forest track in the Pirin Mountains' },
      { src: 'assets/enduro-gallery/enduro-15.jpg', alt: 'ATV rider on a Bansko mountain trail' },
    ],
    intro:
      "Tear up the trails around Bansko on a guided ATV or buggy tour. Our routes wind through Pirin forest tracks, river crossings and open mountain views — all led by a local guide who knows every turn. No previous experience or driving licence is needed; we brief you, kit you out and ride at your pace.",
    highlights: [
      'Guided routes through the Pirin Mountains',
      'No licence or experience required',
      'Single and two-seat buggies + ATVs available',
      'Helmets, goggles and safety briefing included',
      'Suitable for couples, friends and families',
    ],
    whatToExpect:
      "After a safety briefing and a short practice loop, your guide leads you out onto the trails. Expect dust, mud, big views and plenty of grins. We stop for photos and to regroup, and tailor the pace to your group — gentle and scenic, or fast and playful.",
    goodToKnow: [
      'Duration: from 1 hour up to a half day',
      'Season: spring to autumn',
      'Minimum age applies for drivers (passengers can be younger)',
      'Wear clothes and shoes you don’t mind getting dirty',
    ],
    priceFrom: '',
    enquirySubject: 'ATV & Buggy Tour enquiry',
    seo: {
      title: 'ATV & Buggy Tours Bansko | Off-Road in the Pirin Mountains',
      description:
        'Guided ATV and buggy tours in Bansko, Bulgaria — off-road through the Pirin Mountains. No licence or experience needed. Helmets and briefing included. Enquire today.',
      keywords:
        'ATV tours Bansko, buggy tours Bansko, off-road Bansko, quad biking Bulgaria, Pirin Mountains buggy, things to do in Bansko',
    },
  },
  {
    slug: 'shooting-range',
    name: 'Shooting Range',
    tagline: 'Supervised target shooting in Bansko — beginners welcome.',
    heroImage: 'assets/enduro-gallery/enduro-10.jpg',
    heroAlt: 'Shooting range experience in Bansko',
    gallery: [
      { src: 'assets/enduro-gallery/enduro-12.jpg', alt: 'Targets at the Bansko shooting range' },
    ],
    intro:
      'Try your aim at our supervised Bansko shooting range. Whether you have never held a firearm or you shoot regularly, our instructors set you up safely and guide every shot. It is a fun, focused session that works as a stag activity, a group outing or a one-off thrill.',
    highlights: [
      'Qualified instructor with every group',
      'Full safety briefing and equipment provided',
      'Beginner-friendly — no experience needed',
      'Great for groups, stags and team days',
    ],
    whatToExpect:
      'You will get a thorough safety briefing, hands-on instruction and supervised time on the range. Your instructor coaches your stance, grip and aim, and you shoot at targets at a controlled distance.',
    goodToKnow: [
      'Duration: typically 1–2 hours',
      'Season: year-round',
      'Minimum age and ID requirements apply',
      'All equipment and ear/eye protection provided',
    ],
    priceFrom: '',
    enquirySubject: 'Shooting Range enquiry',
    seo: {
      title: 'Shooting Range Bansko | Supervised Target Shooting',
      description:
        'Supervised shooting range in Bansko, Bulgaria — instructor-led target shooting for all levels. Equipment and safety briefing included. Great for groups. Enquire now.',
      keywords:
        'shooting range Bansko, target shooting Bulgaria, Bansko stag activities, things to do in Bansko, group activities Bansko',
    },
  },
  {
    slug: 'camping',
    name: 'Mountain Camping',
    tagline: 'Sleep under the stars in the Pirin Mountains.',
    heroImage: 'assets/home-videos-compressed/enduro-image-2.jpg',
    heroAlt: 'Mountain camping in the Pirin Mountains near Bansko',
    gallery: [
      { src: 'assets/enduro-gallery/enduro-20.jpg', alt: 'Campsite in a Pirin Mountain clearing' },
    ],
    intro:
      'Swap the hotel for a night in the mountains. Our guided camping experiences take you into the Pirin wilderness around Bansko — campfire, big skies and proper quiet. We handle the logistics and the route; you bring a sense of adventure.',
    highlights: [
      'Guided trips into the Pirin Mountains',
      'Campfire, cooking and stargazing',
      'Equipment and route planning sorted for you',
      'Combine with an ATV/buggy tour for a full adventure',
    ],
    whatToExpect:
      'A guide leads you to a scenic camp spot, helps set up and cooks over the fire. Expect an evening around the flames, a night under the stars and a fresh-air start the next morning.',
    goodToKnow: [
      'Duration: overnight (1–2 nights)',
      'Season: late spring to early autumn',
      'A reasonable level of fitness helps',
      'Warm layers recommended — mountain nights are cool',
    ],
    priceFrom: '',
    enquirySubject: 'Mountain Camping enquiry',
    seo: {
      title: 'Mountain Camping Bansko | Guided Pirin Mountains Camping',
      description:
        'Guided mountain camping near Bansko, Bulgaria — campfire and stars in the Pirin Mountains. Equipment and route handled for you. Enquire about dates and groups.',
      keywords:
        'camping Bansko, Pirin Mountains camping, wild camping Bulgaria, things to do in Bansko, mountain adventures Bansko',
    },
  },
  {
    slug: 'snow-riding',
    name: 'Snow Riding',
    tagline: 'Winter thrills in the mountains around Bansko.',
    heroImage: 'assets/enduro-gallery/enduro-15.jpg',
    heroAlt: 'Snow riding in the mountains around Bansko in winter',
    gallery: [
      { src: 'assets/enduro-gallery/enduro-25.jpg', alt: 'Riding through fresh snow near Bansko' },
    ],
    intro:
      'When winter blankets the Pirin Mountains, the riding does not stop. Our guided snow-riding sessions get you out onto the white stuff around Bansko for a completely different kind of adventure. Kit and guidance provided; just bring warm clothes and a smile.',
    highlights: [
      'Guided winter riding in the mountains',
      'All the gear and a full briefing provided',
      'A perfect add-on to a Bansko ski trip',
      'Suitable for adventurous beginners and up',
    ],
    whatToExpect:
      'After kitting up and a safety briefing, your guide leads you out onto snow-covered tracks. Expect cold air, white scenery and a big adrenaline hit — at a pace that suits your group.',
    goodToKnow: [
      'Duration: from 1 hour up to a half day',
      'Season: winter (snow dependent)',
      'Warm, waterproof clothing essential',
      'Subject to weather and snow conditions',
    ],
    priceFrom: '',
    enquirySubject: 'Snow Riding enquiry',
    seo: {
      title: 'Snow Riding Bansko | Winter Adventures in the Mountains',
      description:
        'Guided snow riding in the mountains around Bansko, Bulgaria — winter adventure with all the gear and a guide. The perfect add-on to a Bansko ski trip. Enquire now.',
      keywords:
        'snow riding Bansko, winter activities Bansko, Bansko adventure, things to do in Bansko winter, Pirin Mountains winter',
    },
  },
];

/** Copy for the home page "Activities" overview section. Kept here (not in the
 *  global i18n dict) since it's specific to the activities feature. */
export const ACTIVITIES_SECTION_COPY = {
  heading: 'Our Activities',
  intro:
    'From off-road buggies to the shooting range, mountain camping to winter snow riding — unlock the best of Bansko, all year round.',
  viewActivity: 'Explore →',
  viewAll: 'View all activities',
};

/** Lookup by slug for the detail page. */
export function findActivityBySlug(slug: string): Activity | undefined {
  return ACTIVITIES.find((a) => a.slug === slug);
}
