import type { Translations } from './index';

/**
 * English copy — source of truth. Every page that supports DE reads its slice
 * from here and from [[de]]; the structures must match key-for-key, enforced
 * by the `Translations` type.
 *
 * Page-body translation (template prose, FAQ Q&A, hero rotation) is added per
 * page as DE ships. For now only the SEO meta block is populated, which is
 * enough to wire routing + hreflang + prerender end-to-end.
 */
export const en: Translations = {
  meta: {
    home: {
      title:
        'Bansko Unlocked | ATV, Buggy, Shooting, Camping & Snow Riding',
      description:
        'Adventure activities in Bansko, Bulgaria — ATV & buggy tours, a shooting range, mountain camping and winter snow riding in the Pirin Mountains. Book your Bansko adventure.',
      keywords:
        'Bansko activities, Bansko ATV tours, buggy tours Bansko, shooting range Bansko, camping Bansko, snow riding Bansko, things to do in Bansko',
    },
    enduroTours: {
      title: 'Activities in Bansko | Bansko Unlocked',
      description:
        'Adventure activities in Bansko — ATV & buggy tours, shooting range, camping and snow riding in the Pirin Mountains.',
      keywords:
        'Bansko activities, things to do in Bansko, Bansko adventure',
    },
    about: {
      title: 'About Bansko Unlocked | Adventure Activities in Bansko',
      description:
        'Meet the Bansko Unlocked team — a local crew running adventure activities in the Pirin Mountains: ATV & buggy tours, a shooting range, camping and snow riding.',
      keywords:
        'about Bansko Unlocked, Bansko adventure team, Pirin Mountains activities, things to do in Bansko',
    },
    contact: {
      title: 'Contact Bansko Unlocked | Book Activities in Bansko',
      description:
        'Get in touch with Bansko Unlocked — WhatsApp, email or phone. Plan your Bansko adventure: ATV & buggy tours, shooting range, camping and snow riding.',
      keywords:
        'contact Bansko Unlocked, Bansko activities contact, Bansko adventure enquiry, book Bansko activities',
    },
    faq: {
      title: 'FAQ | Bansko Unlocked — Adventure Activities in Bansko',
      description:
        "Answers about Bansko Unlocked activities — ATV & buggy tours, the shooting range, camping and snow riding: what's included, who can join, booking and more.",
      keywords:
        'Bansko activities FAQ, ATV tours Bansko FAQ, shooting range Bansko, things to do in Bansko',
    },
    reviews: {
      title: 'Reviews | Bansko Unlocked — Bansko Adventure Activities',
      description:
        'Reviews from guests who joined Bansko Unlocked for ATV & buggy tours, the shooting range, camping and snow riding in the Pirin Mountains.',
      keywords:
        'Bansko Unlocked reviews, Bansko activities reviews, ATV tours Bansko reviews, things to do in Bansko',
    },
    team: {
      title: 'Meet the Team | Bansko Unlocked — Local Bansko Guides',
      description:
        'The Bansko Unlocked team — local guides and instructors running ATV & buggy tours, the shooting range, camping and snow riding around Bansko.',
      keywords:
        'Bansko Unlocked team, Bansko activity guides, Pirin Mountains guides, Bansko instructors',
    },
    difficultyLevels: {
      title: 'Enduro Difficulty Levels Bulgaria — Beginner to Pro Tour Guide',
      description:
        'Pick the right Bulgaria enduro tour for your level. Beginner (no licence needed), Advanced and Pro tiers explained — terrain, rider requirements, and which Bansko tour matches.',
      keywords:
        'bulgaria enduro difficulty, enduro for beginners europe, pirin enduro difficulty, bansko enduro levels, hard enduro bulgaria, enduro no licence bulgaria',
    },
    accommodation: {
      title: 'Accommodation | Luxury SPA Hotels for Enduro Tours in Bansko',
      description:
        'Stay in 4-star luxury SPA hotels during your Enduro Brothers tour in Bansko — included in every package. Wellness centre, all meals, and authentic Bulgarian hospitality after epic rides through the Pirin Mountains.',
      keywords:
        'enduro accommodation Bulgaria, Bansko SPA hotel, luxury hotel enduro tour, Pirin Mountains hotel, all-inclusive motorcycle holiday, Bansko hotel spa',
    },
  },
  chrome: {
    nav: {
      home: 'Home',
      activities: 'Activities',
      enduroTours: 'Enduro Tours',
      buggyTours: 'Buggy Tours',
      about: 'About Us',
      contact: 'Contact Us',
      more: 'More',
      team: 'Our Team',
      accommodation: 'Accommodation',
      gallery: 'Gallery',
      blog: 'Blog',
      faq: 'FAQ',
      themeLabel: 'Theme',
      mobileMenuAria: 'Open menu',
      moreMenuAria: 'More pages',
    },
    promo: {
      leadHtml: '<strong>Bansko Unlocked</strong>',
      savingsTemplateEurOnly: '',
      savingsTemplateEurGbp: '',
      cta: '— Explore our activities!',
      closeAria: 'Close promo',
    },
    footer: {
      facebookAria: 'Visit our Facebook page',
      instagramAria: 'Visit our Instagram profile',
      youtubeAria: 'Visit our YouTube channel',
      copyright:
        'Copyright © 2026 Bansko Unlocked - All Rights Reserved',
    },
    floatingHelp: {
      callLabel: 'Click to Call',
      whatsappLabel: 'WhatsApp',
      emailLabel: 'Email',
      contactPrompt: 'Need Help? Contact Us',
    },
    countdown: {
      label: 'Book before this discount ends:',
      day: 'day',
      days: 'days',
      hr: 'hr',
      hrs: 'hrs',
      min: 'min',
      sec: 'sec',
      ended: 'Booking discount ended',
    },
    langToggle: {
      menuAria: 'Change language',
    },
    themeToggle: {
      switchToLight: 'Switch to light theme',
      switchToDark: 'Switch to dark theme',
      ariaLabel: 'Toggle theme',
    },
    difficulty: {
      beginner: 'Beginner',
      advanced: 'Advanced',
      pro: 'Pro',
      intermediate: 'Intermediate',
    },
  },
  pages: {
    home: {
      seoH1: 'Adventure Activities in Bansko, Bulgaria',
      media: {
        videoFallback: 'Your browser does not support the video tag.',
        heroImageAlt: 'Adventure activities in the Pirin Mountains near Bansko',
      },
      heroMessages: [
        {
          title: 'Unlock Your Bansko Adventure',
          subtitle:
            'ATV & buggy tours, shooting range, camping and snow riding — all in one place.',
        },
        {
          title: 'Off-Road in the Pirin Mountains',
          subtitle:
            'Guided ATV and buggy tours — no licence, no experience needed.',
        },
        {
          title: 'More Than Just Skiing',
          subtitle:
            'Year-round adventures around Bansko, summer and winter alike.',
        },
        {
          title: 'Try the Shooting Range',
          subtitle:
            'Supervised target shooting for all levels — a perfect group day out.',
        },
        {
          title: 'Sleep Under the Stars',
          subtitle:
            'Guided mountain camping in the heart of the Pirin wilderness.',
        },
      ],
      buttons: {
        bookAdventure: 'Explore Our Activities',
        buggyPrompt: 'Not sure where to start?',
        bookBuggy: 'See all activities',
      },
      whyChooseUs: {
        heading: 'Why Bansko Unlocked?',
        intro:
          'One local team for the best adventure activities in Bansko — ATV & buggy tours, a shooting range, mountain camping and winter snow riding. No experience needed, all year round.',
        features: [
          {
            title: 'A Range of Adventures',
            body: 'From off-road buggies to the shooting range, camping to snow riding — one place to unlock the best of Bansko.',
            imageAlt: 'Off-road buggy on a Bansko mountain trail',
          },
          {
            title: 'No Experience Needed',
            body: 'Friendly local guides, full safety briefings and all the gear provided. Just turn up ready for an adventure.',
            imageAlt: 'Guide briefing a group before an activity',
          },
          {
            title: 'Year-Round in the Pirin',
            body: 'Summer ATV tours, shooting and camping; winter snow riding. There is always something to do in Bansko.',
            imageAlt: 'Pirin Mountains scenery near Bansko',
          },
          {
            title: 'Easy to Book',
            body: 'Message us on WhatsApp, email or phone and we sort the details — dates, group size and everything else.',
            imageAlt: 'People enjoying an outdoor adventure',
          },
        ],
      },
      faqSchema: [
        {
          question: 'Do I need a licence or experience for the ATV & buggy tours?',
          answer:
            'No. Our guided ATV and buggy tours need no driving licence or previous experience — we give you a full safety briefing and ride at your pace.',
        },
        {
          question: 'What activities does Bansko Unlocked offer?',
          answer:
            'ATV and buggy tours, a supervised shooting range, guided mountain camping, and winter snow riding — all in and around Bansko in the Pirin Mountains.',
        },
        {
          question: 'How do I book an activity?',
          answer:
            'Get in touch via WhatsApp, email or phone with the activity, your dates and group size, and we will sort out the rest.',
        },
      ],
      blog: {
        heading: 'BANSKO GUIDES',
        lede: 'Tips and guides for making the most of your time in Bansko — the best activities, when to come, and what to expect.',
        readMore: 'Read more →',
        allPosts: 'Read all our guides →',
      },
    },
    faq: {
      heading: 'FAQ – Quick Answers Before You Ride',
      intro:
        'Please reach us at <a href="mailto:info@banskounlocked.com">info@banskounlocked.com</a> if you cannot find an answer to your question.',
      items: [
        {
          question: 'Do I need any experience or a licence?',
          answer:
            "✓ No experience or driving licence needed for our ATV & buggy tours, shooting range or snow riding — we give you a full safety briefing and all the gear. Just bring your sense of adventure.",
        },
        {
          question: 'What activities do you offer?',
          answer:
            'We run a range of Bansko adventures:<br>• ATV &amp; buggy tours through the Pirin Mountains<br>• A supervised shooting range<br>• Guided mountain camping<br>• Winter snow riding<br>See the <a href="/activities">activities page</a> for details on each.',
        },
        {
          question: "What's included?",
          answer:
            'Every activity includes the equipment you need plus a full safety briefing and a friendly local guide or instructor. Exactly what comes with each one is listed on its activity page.',
        },
        {
          question: 'How do I book?',
          answer:
            "Booking is quick and personal:<br>1. <strong>Get in touch</strong> by WhatsApp, email or phone with the activity, your dates and group size<br>2. <strong>We confirm</strong> availability and any details<br>3. <strong>Turn up</strong> ready for your adventure!<br><br>Questions? Email us at <a href='mailto:info@banskounlocked.com'>info@banskounlocked.com</a>",
        },
        {
          question: 'Can I book for a group or a stag/hen party?',
          answer:
            'Absolutely — groups, stags, hens, families and team days are all welcome. Tell us your group size and what you fancy and we will put together the right day out.',
        },
        {
          question: "What's the minimum age?",
          answer:
            'Minimum ages vary by activity (drivers on the ATV/buggy tours and the shooting range have age and ID requirements). Younger guests can often still take part as passengers — just ask when you enquire.',
        },
        {
          question: 'When is the best time to come?',
          answer:
            '• <strong>Summer (spring–autumn):</strong> ATV &amp; buggy tours, shooting range and mountain camping<br>• <strong>Winter:</strong> snow riding (snow conditions permitting)<br>There is something to do in Bansko all year round.',
        },
        {
          question: 'What should I bring?',
          answer:
            'We provide the activity equipment and safety gear. Bring:<br>• Clothes and shoes you do not mind getting dirty (or warm, waterproof layers in winter)<br>• Sunglasses and sunscreen in summer<br>• Valid ID/passport<br>• Any personal medications',
        },
        {
          question: 'What happens if the weather is bad?',
          answer:
            'Most activities run in a range of conditions, and we will always put safety first. If the weather makes an activity unsafe, we will reschedule it or suggest an alternative.',
        },
      ],
    },
    reviews: {
      heading: 'What Our Guests Say',
      intro: 'Reviews from guests who joined us for a Bansko adventure',
      readMore: 'Read more',
      readLess: 'Read less',
      swipeHint: '← swipe to browse →',
      moreReviewsPrompt:
        'Been on an adventure with us? We would love to hear how it went.',
      facebookCta: 'Find us on Facebook',
      googleCta: 'Find us on Google',
      previousAria: 'Previous reviews',
      nextAria: 'Next reviews',
    },
    enduroTours: {
      heading: 'Enduro Tours in Bulgaria',
      intro:
        "Ride brand-new 2026 GASGAS & Husqvarna bikes on forest singletrack across the Pirin, Rila & Rhodope Mountains — from gentle beginner trails to technical hard-enduro lines. Every enduro tour in Bulgaria is all-inclusive: bikes, gear, luxury hotel, all meals and airport transfers, with no motorcycle licence needed. Pick the tour that matches your level below.",
      loading: 'Loading tours...',
      specialOffer: 'Special offer',
      validForPeriod: 'Valid for {{ period }} bookings',
      endsDate: 'Ends {{ date }}',
      priceDivider: 'or',
      perUnit: 'per person',
      viewDetails: 'View Details',
      viewAll: 'View all enduro tours',
      mostPopular: 'Our most popular tours',
      whatsIncluded: "What's Included",
      includedItems: [
        { text: 'Brand-new GASGAS & Husqvarna bikes' },
        { text: 'Full riding gear & safety equipment' },
        { text: 'Luxury hotel with SPA facilities' },
        { text: 'All meals included' },
        { text: 'Professional guides' },
        { text: 'Pick-up/drop-off from Sofia or Plovdiv' },
      ],
      admin: {
        addNew: 'Add New Tour',
        edit: 'Edit',
        delete: 'Delete',
        confirmDelete: (title: string) =>
          `Are you sure you want to delete "${title}"?`,
        failedDelete: 'Failed to delete tour. Please try again.',
        failedCreate: 'Failed to create tour. Please try again.',
      },
    },
    buggyTours: {
      heading: 'Off-Grid Buggy Adventure',
      intro:
        "Discover a new level of freedom off the beaten path with our Off-Grid Buggy Adventure — comfort + wild at the same time. This is not rough survival camping — it's elevated adventure with comfort in the wild.",
      loading: 'Loading tours...',
      specialOffer: 'Special offer',
      validForPeriod: 'Valid for {{ period }} bookings',
      endsDate: 'Ends {{ date }}',
      priceDivider: 'or',
      perUnit: 'per buggy (1–4 people)',
      viewDetails: 'View Details',
      viewAll: 'View all buggy tours',
      whatsIncluded: "What's Included",
      includedItems: [
        {
          text: 'Can-Am Maverick X3 4-Seater Buggy – 200hp powerhouse ready for rugged terrain',
        },
        {
          text: 'Professional Guides & Support Crew – personal attention every step of the way',
        },
        {
          text: 'Luxury Hotel Night Before Departure – rest, spa, sauna & jacuzzi included',
        },
        {
          text: 'Camping Equipment – premium inflatable tent, sleeping gear, lighting, power station',
        },
        {
          text: 'Campfire Essentials – fire setup, cooking equipment, seating & ambience',
        },
        {
          text: 'All Meals Included – hearty breakfasts, trail lunches, group dinners',
        },
        { text: 'Airport Transfers – from Sofia or Plovdiv (included)' },
        {
          text: 'Fuel & Logistics Support – we handle all operational aspects',
        },
      ],
      includedTagline:
        "This is not rough survival camping — it's elevated adventure with comfort in the wild.",
      admin: {
        addNew: 'Add New Tour',
        edit: 'Edit',
        delete: 'Delete',
        confirmDelete: (title: string) =>
          `Are you sure you want to delete "${title}"?`,
        failedDelete: 'Failed to delete tour. Please try again.',
        failedCreate: 'Failed to create tour. Please try again.',
      },
    },
    about: {
      h1: 'About Us',
      story: {
        heading: 'OUR PASSION',
        paragraphs: [
          "<strong>BANSKO UNLOCKED</strong> was born from a love of adventure and the untamed beauty of the Pirin Mountains. We're a local team who have spent years exploring the trails, peaks and wild corners around Bansko — and we built this to share them.",
          "From off-road buggies to the shooting range, mountain camping to winter snow riding, our mission is simple: to unlock the best of Bansko for visitors looking for more than just the slopes.",
        ],
        imageAlt: 'Bansko Unlocked adventure in the Pirin Mountains',
      },
      stats: {
        heading: 'BY THE NUMBERS',
        items: [
          { number: '4+', label: 'ADVENTURE ACTIVITIES' },
          { number: '1', label: 'STUNNING MOUNTAIN RANGE' },
          { number: '365', label: 'DAYS A YEAR' },
          { number: '100%', label: 'LOCAL TEAM' },
        ],
      },
      playground: {
        heading: 'THE PLAYGROUND',
        imageAlt: 'The Pirin Mountains around Bansko',
        paragraphs: [
          'Bansko sits at the foot of the <strong>Pirin Mountains</strong> — a UNESCO World Heritage area of forest tracks, alpine peaks, crystal-clear rivers and breathtaking views. It is one of the best adventure playgrounds in Bulgaria.',
          'Famous as a ski resort in winter, the area is just as spectacular in summer — perfect for off-road tours, camping and exploring. We know it inside out.',
        ],
        didYouKnow:
          "<strong>Did you know?</strong> The Pirin National Park is a UNESCO World Heritage Site, home to some of Europe's oldest trees and most dramatic mountain scenery.",
      },
      founder: {
        heading: 'OUR STORY',
        visionHeading: 'Why we started',
        paragraphs: [
          'We grew up in and around these mountains and spent years riding, exploring and camping in them. Friends visiting Bansko always asked the same thing: "What else is there to do here?"',
          'Bansko Unlocked is our answer — a single local team offering the best adventure activities in one place, with the gear, the guides and the local knowledge to make it easy.',
        ],
        quote:
          '"Adventure isn\'t about conquering mountains — it\'s about discovering yourself among them."',
        achievementsHeading: 'WHAT WE BRING',
        achievements: [
          { icon: '🗺️', text: 'Deep local knowledge of the Pirin Mountains' },
          { icon: '🛡️', text: 'Safety-first briefings and quality gear' },
          { icon: '🎯', text: 'A range of activities for every group' },
          { icon: '❄️', text: 'Year-round adventures, summer and winter' },
          { icon: '🤝', text: 'A friendly, local team' },
        ],
      },
      teamTeaser: {
        heading: 'MEET THE TEAM',
        lede: 'Our activities are led by a friendly, locally-based team of guides and instructors who know Bansko and the Pirin Mountains inside out.',
        photoAlt:
          'The Bansko Unlocked team in the Pirin Mountains',
        cta: 'Meet the Full Team',
      },
      blog: {
        heading: 'FROM THE BLOG',
        lede: 'Guides and tips for making the most of your time in Bansko — the best activities, when to come, and what to expect.',
        readMore: 'Read more →',
        allPosts: 'All posts →',
      },
      collection: {
        heading: 'OUR ACTIVITIES',
        description:
          'Discover our adventure activities in and around Bansko, Bulgaria',
      },
      copyright:
        'Copyright © 2026 Bansko Unlocked - All Rights Reserved',
    },
    contact: {
      h1: 'Contact Us',
      subtitle: 'Drop us a line!',
      form: {
        nameLabel: 'Name',
        namePlaceholder: 'Your full name',
        emailLabel: 'Email*',
        emailPlaceholder: 'your.email@example.com',
        messageLabel: 'Message',
        messagePlaceholder:
          "Tell us about your question or which activity you'd like to know more about...",
        send: 'Send',
        sending: 'Sending...',
        recaptchaNotice:
          'This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank">Terms of Service</a> apply.',
        nameRequired: 'Name is required',
        nameMinLength: 'Name must be at least 2 characters',
        emailRequired: 'Email is required',
        emailInvalid: 'Please enter a valid email address',
        messageRequired: 'Message is required',
        messageMinLength: 'Message must be at least 10 characters',
        openingEmailClient: 'Opening your email client...',
        messageSentTitle: 'Message sent!',
        messageSent: "Thanks for reaching out — we've received your message and will get back to you within 24 hours.",
        messageFailedTitle: "Couldn't send message",
        messageFailed: 'Something went wrong sending your message. Please try again, or email us directly at info@banskounlocked.com.',
        fillFieldsCorrectly: 'Please fill in all required fields correctly.',
        snackbarClose: 'Close',
      },
      directContact: {
        heading: 'Get in touch directly',
        intro1:
          'If you have got a question or concern you can get in touch with us directly here.',
        intro2: 'Our team will get back to you within few hours.',
        whatsappButton: 'Message us on WhatsApp',
        hurryText: "Or if you're in a hurry you can reach us directly on:",
        phoneLabel: 'Phone:',
        clickToCall: '📞 Click to Call',
        emailLabel: 'Email:',
      },
      location: {
        heading: 'Where to find us',
        region: 'Bansko, Pirin Mountains',
        province: 'Blagoevgrad Province',
        country: 'Bulgaria',
        mapTitle:
          'Map showing Bansko Unlocked in Bansko, Pirin Mountains',
      },
    },
    team: {
      h1: 'Meet the Bansko Unlocked Team',
      lede: 'Our activities are led by a friendly, locally-based team of guides and instructors who know Bansko and the Pirin Mountains inside out — Ibrahim, Medy, Funi and Funi Nice.',
      groupPhotoAlt:
        'The Bansko Unlocked team in the Pirin Mountains',
      specialitiesHeading: 'Specialities',
      guides: {
        ibrahim: {
          portraitAlt:
            'Ibrahim, founder of Bansko Unlocked, in the Pirin Mountains',
          role: 'Founder & Owner',
          statLabel: 'Years exploring the Balkan mountains',
          bio: 'Ibrahim founded Bansko Unlocked and has spent more than 15 years exploring the Balkan mountains. He looks after the gear and the logistics, and his focus is creating real adventures with good atmosphere, proper support and unforgettable days out.',
          legend:
            'Ibrahim knows the area inside out and always makes sure the group feels looked after.',
          credentials: [
            'Founder & owner of Bansko Unlocked',
            '15+ years exploring the Pirin Mountains',
            'Looks after the equipment and logistics',
            'From relaxed family days to bigger adventures',
            'Encyclopaedic knowledge of the area around Bansko',
          ],
        },
        medy: {
          portraitAlt:
            'Medy, activity guide at Bansko Unlocked',
          role: 'Activity Guide',
          statLabel: 'Years of experience',
          bio: "Medy has over 10 years of experience in the mountains and is known for his calm, safety-first approach. He enjoys helping guests build confidence and have a great time, whatever their experience level.",
          legend:
            'Medy keeps every group moving while making sure everyone enjoys the day.',
          credentials: [
            '10+ years of experience in the mountains',
            'Calm, safety-first approach',
            'Great with first-timers',
            'Builds guest confidence',
            'Keeps the group together and having fun',
          ],
        },
        funi: {
          portraitAlt:
            'Funi, activity guide at Bansko Unlocked',
          role: 'Activity Guide',
          statLabel: 'Years of experience',
          bio: 'Funi has more than 10 years in the mountains and brings great energy to every day out. With his positive attitude, good humour and knack for reading a group, he knows how to make every adventure fun and memorable.',
          credentials: [
            '10+ years of experience in the mountains',
            'Forest trails and mountain routes',
            'Adapts the day to mixed groups',
            'Great energy and humour all day',
            'Makes every day out fun',
          ],
        },
        funiNice: {
          portraitAlt:
            'Funi Nice, senior guide at Bansko Unlocked, in the Pirin Mountains',
          role: 'Senior Guide',
          statLabel: 'Years of experience',
          bio: 'With more than 20 years in the mountains, Funi Nice is the one you want when the going gets adventurous. Remote trails, big terrain and proper mountain days are his natural habitat — and he loves sharing them with guests up for a challenge.',
          legend:
            'Legend says he once spent 4 hours on a 3-kilometre stretch — and enjoyed every second of it.',
          credentials: [
            '20+ years of experience in the mountains',
            'Remote trails and big mountain terrain',
            'Deep knowledge of the Pirin',
            'The guide for guests after a challenge',
            'Endless enthusiasm for the outdoors',
          ],
        },
      },
      ares: {
        role: 'Head of Security',
        bio: "Ares is the official guard dog of Bansko Unlocked and takes his role very seriously… at least when he's awake. His duties include guarding the gear, supervising the base and welcoming guests after a long day out. Friendly with guests, suspicious of strangers and always somewhere around the action.",
      },
      whyNamedGuides: {
        heading: 'Why local guides matter',
        body: "A great day out lives or dies on the guide. The right pace, the right call when the weather shifts, knowing the area inside out — that is the difference between a good day and a brilliant one. Every Bansko Unlocked activity is led by one of our local team, who know Bansko and the Pirin Mountains better than anyone.",
      },
      rideWithUs: {
        heading: 'Adventure with the team',
        lede: 'Whatever you fancy and whatever your experience, there is an activity for you.',
        newRiders: {
          label: 'New to it',
          title: 'ATV & Buggy Tours',
          meta: 'Beginner-friendly · no licence required',
        },
        experiencedRiders: {
          label: 'After a thrill',
          title: 'Snow Riding',
          meta: 'Winter adventure · all the gear provided',
        },
        secondaryStart: 'Browse everything on the',
        enduroToursLink: 'activities',
        secondaryMid: 'page, or',
        accommodationLink: 'get in touch',
        secondaryEnd: 'to plan your trip.',
      },
    },
    tourDetail: {
      loading: 'Loading tour...',
      detailsHeading: 'Tour Details',
      earlyBird: 'Early Bird:',
      durationLabel: 'Duration:',
      averageDistanceLabel: 'Average Distance:',
      difficultyLabel: 'Difficulty:',
      whatsIncluded: "What's Included",
      includedItems: [
        { icon: 'motorcycle', text: 'Brand-new GASGAS & Husqvarna bikes' },
        { icon: 'security', text: 'Full riding gear & safety equipment' },
        { icon: 'hotel', text: 'Luxury hotel accommodation with SPA' },
        { icon: 'restaurant', text: 'All meals (breakfast, lunch & dinner)' },
        {
          icon: 'support_agent',
          text: 'Professional guides & on-trail support',
        },
        {
          icon: 'local_shipping',
          text: 'Pick-up/drop-off from Sofia or Plovdiv',
        },
      ],
      itineraryHeading: 'Daily Itinerary',
      dayLabel: 'Day',
      pricingHeading: 'Pricing',
      specialOffer: 'Special offer',
      validForPeriod: (period) => `Valid for ${period} bookings`,
      perPerson: 'per person',
      priceDivider: 'or',
      depositNotice:
        'To secure your spot, a €100 deposit is required. The rest of the amount is payable upon your arrival.',
      additionalOptions: 'Additional Options',
      newTires: 'New tires',
      newTiresPrice: '+€75 per bike',
      bookingEmailIntro:
        'After reserving your spot, select any extras above, then email us at',
      bookingEmailOutro:
        "with your preferred dates and the number of people in your group. We'll promptly reach out to confirm your reservation.",
      checkout: {
        reserveButton: 'Reserve this tour',
        whatsappCta: 'Have questions? Chat on WhatsApp',
        closeAria: 'Close booking form',
        title: 'Reserve your spot',
        subtitle:
          'A few quick details and a €100 deposit to secure your place. The rest is payable on arrival.',
        nameLabel: 'Full name',
        emailLabel: 'Email address',
        phoneLabel: 'Phone',
        phonePlaceholder: '+44 7700 900000',
        experienceLabel: 'Riding experience',
        experiencePlaceholder: 'Select all that apply — mixed-level groups welcome',
        experienceOptions: {
          beginner: 'Beginner / no licence',
          intermediate: 'Intermediate',
          advanced: 'Advanced / pro',
        },
        ridersLabel: 'Number of riders',
        ridersHint: (min) => `Minimum ${min} riders per booking`,
        datesLabel: 'Preferred dates',
        datesPlaceholder: 'e.g. mid-July, or 12–18 August',
        dateStart: 'Start date',
        dateEnd: 'End date',
        preferredContactLabel: 'Preferred contact method',
        contactOptions: {
          whatsapp: 'WhatsApp',
          phone: 'Phone call',
          email: 'Email',
          other: 'Other',
        },
        contactOtherPlaceholder: 'How should we reach you? (e.g. Telegram, Signal)',
        extrasLabel: 'Add-ons',
        continueButton: 'Continue to deposit',
        emailInvalid: 'Please enter a valid email address.',
        backButton: 'Back',
        summaryTitle: 'Booking summary',
        summaryTour: 'Tour',
        summaryRiders: 'Riders',
        summaryExperience: 'Experience',
        summaryDates: 'Preferred dates',
        summaryPhone: 'Phone',
        summaryContact: 'Contact via',
        summaryExtras: 'Add-ons',
        paymentHeading: 'Pay your €100 deposit securely',
        securePaymentInfo:
          'Your payment is handled entirely by PayPal. We never see, store or process your card details.',
        submitting: 'Confirming your booking…',
        successTitle: 'Booking confirmed — see you on the trails!',
        successBody:
          "Your deposit is in and we've emailed your confirmation. Our team will be in touch within 24 hours to finalise the details.",
        successClose: 'Done',
        emailFallback:
          "Payment received! We couldn't auto-send your confirmation — please email info@banskounlocked.com so we can finalise your booking.",
      },
      socialProof: {
        bookedRecently: (count) => `${count} riders booked in the last 30 days`,
        fillingFast: (month) => `${month} is filling up fast — reserve early`,
      },
      requirementsHeading: 'Requirements & Information',
      requirements: [
        {
          icon: 'check_circle',
          title: 'No License Needed',
          body: 'No motorcycle license required - just bring your sense of adventure!',
        },
        {
          icon: 'person',
          title: 'Minimum Age',
          body: '16 years old (parental consent required for 16-17 year olds)',
        },
        {
          icon: 'backpack',
          title: 'What to Bring',
          body: 'Sturdy boots, comfortable clothes, sunglasses, personal toiletries, and valid ID',
        },
        {
          icon: 'cloud',
          title: 'Weather Policy',
          body: 'Tours run in all weather conditions with appropriate gear provided',
        },
      ],
      reviewsHeading: 'What riders said about this tour',
      starsAria: '5 out of 5 stars',
      notFoundHeading: 'Tour Not Found',
      notFoundBody:
        "The tour you're looking for doesn't exist or has been removed.",
      backToTours: 'Back to Tours',
      seo: {
        // Lead with the tour's own (distinct) name so each tour page has a
        // UNIQUE <title> — the old duration+price format produced byte-identical
        // titles for same-duration/price tours, which cannibalised each other.
        // Duration/price/all-inclusive now live in the description below.
        title: (tourTitle) => `${tourTitle} — Enduro Tour Bulgaria, No Licence`,
        description: (
          tourDescription,
          isBeginner,
          duration,
          displayPrice,
          basePrice,
        ) =>
          `${tourDescription} ${
            isBeginner
              ? 'No license needed! All-inclusive: luxury hotel, meals, brand-new bikes, expert guides.'
              : 'All-inclusive: luxury hotel with SPA, meals, premium bikes, professional guides.'
          } Duration: ${duration}. Price: €${Number(displayPrice)}${
            basePrice ? ` (was €${Number(basePrice)})` : ''
          }. Bansko, Razlog & Blagoevgrad region. Book now!`,
        keywords: (tourTitle, duration, displayPrice, difficulty, isBeginner) =>
          `${tourTitle}, enduro tour ${duration}, Bansko motorcycle tour €${displayPrice}, ${difficulty}, Pirin Rila & Rhodope Mountains enduro, Bulgarian motorcycle holiday, guided enduro tour, all-inclusive motorcycle tour, ${
            isBeginner ? 'no license enduro tour' : 'advanced enduro tour'
          }`,
      },
    },
    buggyTourDetail: {
      loading: 'Loading tour...',
      detailsHeading: 'Tour Details',
      earlyBird: 'Early Bird:',
      durationLabel: 'Duration:',
      averageDistanceLabel: 'Average Distance:',
      difficultyLabel: 'Difficulty:',
      whatsIncluded: "What's Included",
      includedItems: [
        {
          icon: 'directions_car',
          text: 'Can-Am Maverick X3 4-Seater Buggy – 200hp powerhouse ready for rugged terrain',
        },
        {
          icon: 'support_agent',
          text: 'Professional Guides & Support Crew – personal attention every step of the way',
        },
        {
          icon: 'hotel',
          text: 'Luxury Hotel Night Before Departure – rest, spa, sauna & jacuzzi included',
        },
        {
          icon: 'camping',
          text: 'Camping Equipment – premium inflatable tent, sleeping gear, lighting, power station',
        },
        {
          icon: 'outdoor_grill',
          text: 'Campfire Essentials – fire setup, cooking equipment, seating & ambience',
        },
        {
          icon: 'restaurant',
          text: 'All Meals Included – hearty breakfasts, trail lunches, group dinners',
        },
        {
          icon: 'local_shipping',
          text: 'Airport Transfers – from Sofia or Plovdiv (included)',
        },
        {
          icon: 'local_gas_station',
          text: 'Fuel & Logistics Support – we handle all operational aspects',
        },
      ],
      includedTagline:
        "This is not rough survival camping — it's elevated adventure with comfort in the wild.",
      itineraryHeading: 'Daily Itinerary',
      dayLabel: 'Day',
      pricingHeading: 'Pricing',
      specialOffer: 'Special offer',
      validForPeriod: (period) => `Valid for ${period} bookings`,
      perBuggy: 'per buggy (1–4 people)',
      priceDivider: 'or',
      depositNotice:
        'To secure your dates, a €200 deposit is required. The rest of the payment is due upon arrival.',
      bookingEmailIntro: 'After reserving your spot, email us at',
      bookingEmailOutro:
        "with your preferred dates and the number of people in your group. We'll promptly reach out to confirm your reservation.",
      requirementsHeading: 'Requirements & What to Bring',
      requirements: [
        {
          icon: 'badge',
          title: 'Valid ID',
          body: 'Valid photo ID or passport required',
        },
        {
          icon: 'checkroom',
          title: 'Clothing & Gear',
          body: "Comfortable off-road clothing & protective gear if you have it. If you don't have it we will provide it for you",
        },
        {
          icon: 'person',
          title: 'Minimum Age',
          body: 'Minimum 16 years old with parental consent. Best suited for adults and families with older teens',
        },
        {
          icon: 'emoji_emotions',
          title: 'Positive Mentality',
          body: 'Bring a positive mentality and sense of adventure!',
        },
      ],
      faqHeading: 'Frequently Asked Questions',
      faq: [
        {
          question: 'Do I need off-road driving experience?',
          answer:
            'No official requirement — we guide you and adapt routes based on skill level.',
        },
        {
          question: 'Is insurance included?',
          answer:
            'Standard tour insurance is included. For extra buggy damage coverage, ask us for optional protection.',
        },
        {
          question: 'What age can join?',
          answer:
            'Minimum 16 years old with parental consent. Best suited for adults and families with older teens.',
        },
        {
          question: 'Can I ride solo?',
          answer: 'Yes — buggies can be driven solo.',
        },
      ],
      whyDifferentHeading: 'Why This Tour Is Different',
      whyDifferentIntro: 'This is no ordinary adventure:',
      whyDifferentPoints: [
        "It's comfort + wild at the same time",
        "It's communal and unforgettable",
        "It's a memory, not just a ride",
      ],
      whyDifferentTagline: 'You leave civilization — and find yourself.',
      notFoundHeading: 'Tour Not Found',
      notFoundBody:
        "The tour you're looking for doesn't exist or has been removed.",
      backToBuggyTours: 'Back to Buggy Tours',
      seo: {
        title: (_tourTitle, displayPrice, duration) =>
          `${duration.replace(/^(\d+)\s*Days?$/i, '$1-Day')} Buggy Tour Bansko, Bulgaria — All-Inclusive €${displayPrice}`,
        description: (tourDescription, duration, displayPrice, basePrice) =>
          `${tourDescription} All-inclusive off-grid buggy adventure: Can-Am Maverick, camping, all meals, airport transfers, expert guides. Duration: ${duration}. Price: €${displayPrice}${
            basePrice ? ` (was €${basePrice})` : ''
          }. Bansko, Pirin, Rila & Rhodope Mountains, Bulgaria. Book now!`,
        keywords: (tourTitle, duration, displayPrice) =>
          `${tourTitle}, buggy tour ${duration}, Can-Am Maverick Bulgaria, Bansko buggy tour €${displayPrice}, off-road buggy adventure, Pirin Rila Rhodope buggy tour, off-grid camping Bulgaria, family off-road adventure`,
      },
    },
    difficultyLevels: {
      h1: 'Enduro Difficulty Levels — Bulgaria Tours, Beginner to Pro',
      intro:
        'Every rider arrives in Bansko with a different baseline. To make booking a Bulgaria enduro tour straightforward, we group all our rides across the Pirin, Rila & Rhodope Mountains into three honest difficulty tiers — <strong>Beginner</strong>, <strong>Advanced</strong> and <strong>Pro</strong>. Use this page to pick the level that matches your real riding ability, see exactly what terrain to expect, and jump straight to the tours that fit.',
      calibrate: {
        heading: 'How we calibrate difficulty',
        paragraphs: [
          "Our scale is built around four things: <strong>terrain</strong>, <strong>distance per day</strong>, <strong>technical line choice</strong>, and <strong>rider fitness</strong>. Where competitors quote a 1-5 number that means nothing in practice, we describe the ground under your wheels and the decisions you'll be making at 30 km/h. We ride these trails year-round; the descriptions below match what a typical group experiences on a dry day in May-October. Wet conditions push every level half a tier harder — and that's worth knowing before you book.",
          "Critically, <strong>no Bulgaria enduro tour with us requires a motorcycle licence</strong>. Bulgarian off-road law permits guided riding on private land and forestry roads without the road licence required in the UK, Germany or Spain. That's why a Beginner week here is genuinely accessible to first-time riders in a way most European enduro destinations aren't.",
        ],
      },
      levels: [
        {
          badge: 'Beginner',
          title: 'Beginner — your first time on a dirt bike',
          oneLiner:
            'No motorcycle licence required. Forest fire-roads, gentle gradients, dedicated instructor time.',
          description:
            "If you've never thrown a leg over an enduro bike, or you only ride road, this is where you start. Day one of every Beginner tour begins with hands-on coaching: clutch control, body position, standing on the pegs, picking the bike up when (not if) you drop it. From there we ride wide forest tracks above Bansko at a relaxed pace — usually 30-50 km of riding with long lunch breaks at mountain restaurants. There is no pressure to keep up with anyone but yourself, and your guide stays at the back to coach you through each corner.",
          terrainHeading: "Terrain you'll ride",
          terrain: [
            'Wide gravel and forest fire-roads',
            'Gentle climbs (5-10% gradient)',
            'Mostly dry surfaces in the riding season',
            'No technical rock or root sections',
          ],
          riderHeading: 'Rider requirements',
          rider: [
            'No licence required (Bulgarian off-road law)',
            'Push-bike confidence is enough — you do not need road experience',
            'Comfortable being a passenger in a car on twisty roads',
          ],
          recommendedHeading: 'Recommended tours at this level',
          recommendedTours: [
            { title: "New Rider's Trail Discovery", duration: '5 Days' },
            { title: 'Weekend Wheels Adventure', duration: '4 Days' },
            { title: 'Weeklong Adventure Retreat', duration: '7 Days' },
          ],
          imageAlt:
            'Beginner enduro rider on a forest fire-road above Bansko, Bulgaria',
        },
        {
          badge: 'Advanced',
          title: 'Advanced — you ride and want to be pushed',
          oneLiner:
            'Mixed terrain, technical climbs, full riding days. You already know how to stand on the pegs.',
          description:
            "Advanced riders typically have one or two seasons of trail or enduro experience — UK green-laning, Welsh trail days, a few Spanish or Romanian holidays. Days are longer (60-120 km, 6-8 hours in the saddle) with a sharper pace. Terrain mixes the fire-roads of the Beginner days with single-track sections, mud, loose-rock climbs, and sustained descents. You'll learn the Pirin Mountains the way the locals ride them — long traverses across the ridgeline rather than circular forest loops. Guides ride mid-pack and pick line choices live to match the group.",
          terrainHeading: "Terrain you'll ride",
          terrain: [
            'Single-track and forest tracks interleaved',
            'Loose rock, roots, occasional mud',
            'Sustained climbs up to 1,500 m elevation gain in a day',
            'Long descents off the Pirin ridgeline',
          ],
          riderHeading: 'Rider requirements',
          rider: [
            'Comfortable standing on the pegs for sustained periods',
            'Have ridden a 250cc+ off-road bike before',
            'Can pick the bike up unassisted',
            'Happy with 6-8 hours saddle time per day',
          ],
          recommendedHeading: 'Recommended tours at this level',
          recommendedTours: [
            { title: 'Weekend Wheels Adventure', duration: '4 Days' },
            { title: 'Weeklong Adventure Retreat', duration: '7 Days' },
            { title: "New Rider's Trail Discovery", duration: '5 Days' },
          ],
          imageAlt:
            'Advanced enduro rider on a technical single-track climb in the Pirin Mountains',
        },
        {
          badge: 'Pro',
          title: 'Pro — extreme enduro on protected Pirin terrain',
          oneLiner:
            "Hard enduro single-track, rock gardens, hike-a-bike sections. You're chasing the line, not the view.",
          description:
            "Pro days are what brings repeat customers back. Small groups of 3-5 riders, trails the guidebooks don't list, and terrain you have to earn — hard enduro single-track, hike-a-bike rock gardens, exposed traverses, and short technical climbs that demand throttle precision. Pro-level guests typically ride GASGAS EC 300 or Husqvarna TE 300 two-strokes; four-strokes are available on request, though most riders self-select to two-stroke after day one.",
          terrainHeading: "Terrain you'll ride",
          terrain: [
            'Hard enduro single-track',
            'Rock gardens and root steps',
            'Hike-a-bike sections (10-50 m at a time)',
            'Exposed ridge traverses, technical descents',
          ],
          riderHeading: 'Rider requirements',
          rider: [
            'Multiple seasons of enduro experience',
            'Confident on rocky and rooty terrain',
            'Strong fitness — Pirin days are physical',
            'Happy on a 300cc two-stroke',
          ],
          recommendedHeading: 'Recommended tours at this level',
          recommendedTours: [
            { title: "Pro Rider's 3-Day Expedition", duration: '5 Days' },
            { title: 'Weeklong Adventure Retreat', duration: '7 Days' },
          ],
          imageAlt:
            'Pro enduro rider tackling a rocky single-track in Pirin National Park, Bulgaria',
        },
      ],
      bulgariaVsRest: {
        heading: 'Why Bulgaria sits between Spain and Romania',
        paragraphs: [
          'UK and German riders shopping European enduro holidays usually compare three destinations: Spain (dry, rocky, well-trodden), Romania (steep, muddy, raw), and Bulgaria (the in-between). Pirin trails offer the technical mix of Romania without the relentless mud, and the predictability of Spain without the queues at the popular Andalusian operators. For a UK rider flying out of Gatwick, Stansted or Manchester, Sofia is a 2h 45m direct flight — the same as a Spanish hop, and shorter than the drive from London to Wales.',
          "The result: a Beginner can do their first dirt-bike week here without being scared off, and a Pro rider in the same group can ride hard enduro single-track the same afternoon. That mixed-group flexibility is the operational reason behind our three-tier scale — it's not marketing copy, it's how we actually run the trips.",
        ],
      },
      faqHeading: 'Common questions about Bulgaria enduro difficulty',
      faqs: [
        {
          question:
            'Can a complete beginner really do an enduro tour in Bulgaria?',
          answer:
            'Yes. Bulgarian off-road law does not require a motorcycle licence for riding on private and forest land with a guided operator, which is why ~40% of our Beginner-tour guests have never ridden a motorcycle before. Day one is structured coaching; days two and three are real riding at your pace.',
        },
        {
          question:
            'How does Bulgaria enduro difficulty compare to Spain or Romania?',
          answer:
            'Bulgarian Pirin terrain sits between Spanish and Romanian enduro in technical difficulty. Spain (Andalusia, Catalonia) is typically drier and rockier; Romania (Transylvanian Alps) is muddier and steeper. Bulgaria offers a wider mix in the same week — you can ride beginner forest-road one day and hard enduro single-track the next, with the same hotel base.',
        },
        {
          question: 'What if my group has mixed ability levels?',
          answer:
            "Our 4-day and 7-day tours run with two guides whenever there's a 3+ rider gap in ability, so beginners aren't held back by slow days and advanced riders aren't pushed beyond their comfort zone. Mixed-ability stag and birthday groups are a large part of our bookings — tell us at the enquiry stage.",
        },
        {
          question: 'Can I move up a level mid-tour?',
          answer:
            "Yes — and most Beginner-tour guests do by day three. Guides assess your line choices and decision-making on day one's coaching loop and will quietly offer harder lines on day two if you're ready. Conversely, if Pro terrain turns out to be over your head, we can pivot the next day to Advanced trails.",
        },
        {
          question: 'Do you cap group sizes?',
          answer:
            'Beginner and Advanced tours run up to 6 riders per guide. Pro tours are capped at 5 per guide and we prefer 3-4 — the technical terrain rewards low-noise small groups.',
        },
      ],
      cta: {
        heading: 'Ready to pick your tour?',
        body: "See the full list of enduro tours and prices, or get in touch and we'll match you to the right week based on a few quick questions.",
        primary: 'View enduro tours',
        secondary: 'Get in touch',
      },
      breadcrumb: 'Difficulty Levels',
    },
    accommodation: {
      h1: 'Welcome to our accommodation',
      subtitle: 'OF ENDURO BROTHERS BULGARIA',
      intro:
        'We believe every guest is special. With us you can enjoy luxury amenities including a deluxe SPA centre and exquisite international cuisine. Experience the perfect blend of modern comfort, cosy atmosphere, and impeccable service.',
      imageAlts: {
        hotelExterior: 'Hotel exterior',
        hotelRoom: 'Hotel room',
        hotelLounge: 'Hotel lounge',
        dining1: 'Dining experience',
        dining2: 'Local cuisine',
        dining3: 'Local cuisine',
        poolIndoor: 'Indoor swimming pool',
        poolArea: 'Pool area',
        poolFacilities: 'Pool facilities',
        spaRelax: 'Spa relaxation area',
        spaTreatment: 'Spa treatment room',
        jacuzzi: 'Jacuzzi wellness area',
        fitness: 'Fitness center',
      },
      dining: {
        heading: 'DINING WITH STYLE',
        body: "We at Enduro Brothers Bulgaria like food. In fact, we love food! At the end of a hard day's riding, we understand the importance of enjoying a delicious meal. That's why our packages include locally produced meat and cheese, fresh vegetables, and fish caught by local fishermen. We take pride in our food, and we believe that a great meal can make all the difference in your tour experience.",
      },
      pool: {
        heading: 'Swimming Pool',
        body: 'Dive into relaxation with our stunning swimming facilities. Our indoor pool features mineral water maintained at 30 degrees all year around, while our outdoor pool offers breathtaking views of the surrounding landscape. Perfect for unwinding after an adventurous day of enduro riding.',
      },
      spa: {
        heading: 'Spa & Wellness',
        body: 'Rejuvenate your body and mind at our luxury spa center. We offer a complete wellness experience with professional massage treatments, traditional sauna, steam bath, and dedicated relaxation areas. Let our skilled therapists help you recover from your enduro adventures.',
      },
      fitness: {
        heading: 'Fitness Center',
        body: "Stay in peak condition at our fully equipped fitness center. Whether you want to maintain your training routine or prepare for tomorrow's ride, our modern equipment and spacious facility provide everything you need for a complete workout experience.",
      },
    },
  },
};
