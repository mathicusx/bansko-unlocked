import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Tour } from './tours/tour.entity';
import { User } from './users/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Tour, User],
  synchronize: true,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const enduroTours = [
  {
    title: 'WEEKEND WHEELS ADVENTURE',
    type: 'enduro' as const,
    promo: '',
    description: 'Kick up some dirt and fuel your weekend with an epic enduro ride — two days of trails, thrills, and pure adventure on two wheels.',
    priceEur: 900,
    priceGbp: 785,
    promoPriceEur: 850,
    promoPriceGbp: 740,
    promoEndDate: '2026-02-25T23:59',
    image: 'assets/enduro-gallery/enduro-1.jpg',
    duration: '4 Days',
    durationDetails: '4 days (3 nights) from which 2 days are for riding',
    averageDistance: '60-120km per day - between 6 and 8 hours',
    difficulty: ['Beginner', 'Advanced', 'Pro'],
    tourDetails: [
      { day: 1, title: 'Arrival Day', description: 'Arrival at the airport (SOFIA or PLOVDIV) where you will be picked up and transferred to the Hotel in the mountains and sorting documentation and the paperwork.', image: 'assets/enduro-gallery/enduro-5.jpg' },
      { day: 2, title: 'Riding Day', description: 'Breakfast and leaving with the bikes around 10 am, riding on various tracks and uphills, lunch at the local mountain restaurants between 13pm-14pm and coming back to the hotel at 17pm. Where you can enjoy on SPA and dinner.', image: 'assets/enduro-gallery/enduro-10.jpg' },
      { day: 3, title: 'Riding Day', description: 'Same set up but a very different route.', image: 'assets/enduro-gallery/enduro-15.jpg' },
      { day: 4, title: 'Departure Day', description: 'Final day with departure arrangements and transfer to airport.', image: 'assets/enduro-gallery/enduro-20.jpg' },
    ],
  },
  {
    title: "PRO RIDER'S 3-DAY EXPEDITION",
    type: 'enduro' as const,
    promo: '',
    description: 'A challenging 3-day enduro journey built for seasoned riders — conquer rugged trails, push your limits, and experience adventure at its peak.',
    priceEur: 1100,
    priceGbp: 960,
    promoPriceEur: 980,
    promoPriceGbp: 855,
    promoEndDate: '2026-02-25T23:59',
    image: 'assets/enduro-gallery/enduro-15.jpg',
    duration: '5 Days',
    durationDetails: '5 days (4 nights) from which 3 days are for riding',
    averageDistance: '60-120km per day - between 6 and 8 hours',
    difficulty: ['Pro'],
    tourDetails: [
      { day: 1, title: 'Arrival Day', description: 'Arrival at the airport (SOFIA or PLOVDIV) where you will be picked up and transferred to the Hotel in the mountains and sorting documentation and the paperwork.', image: 'assets/enduro-gallery/enduro-25.jpg' },
      { day: 2, title: 'Riding Day', description: 'Breakfast and leaving with the bikes around 10 am, riding on various tracks and uphills, lunch at the local mountain restaurants between 13pm-14pm and coming back to the hotel at 17pm. Where you can enjoy on SPA and dinner.', image: 'assets/enduro-gallery/enduro-30.jpg' },
      { day: 3, title: 'Riding Day', description: 'After a refreshing breakfast, we embark on the bikes around 10 am, delving into a new array of tracks and challenging uphills. Midday brings a delightful break for lunch at local mountain restaurants from 1 pm to 2 pm, before our return to the hotel by 17pm. Relax and unwind with the available SPA amenities before a sumptuous dinner.', image: 'assets/enduro-gallery/enduro-35.jpg' },
      { day: 4, title: 'Riding Day', description: 'Same set up but a very different route.', image: 'assets/enduro-gallery/enduro-40.jpg' },
      { day: 5, title: 'Departure Day', description: 'Breakfast, cheking out from the hotel and transfer back to the airport.', image: 'assets/enduro-gallery/enduro-45.jpg' },
    ],
  },
  {
    title: "NEW RIDER'S TRAIL DISCOVERY",
    type: 'enduro' as const,
    description: "Ride through Bulgaria's forests in peak autumn colors for an unforgettable visual experience.",
    priceEur: 1100,
    priceGbp: 955,
    promoPriceEur: 980,
    promoPriceGbp: 855,
    promoEndDate: '2026-02-25T23:59',
    image: 'assets/enduro-gallery/enduro-50.jpg',
    duration: '5 Days',
    durationDetails: '5 days (4 nights) from which 3 days are for riding',
    averageDistance: '60-120km per day - between 6 and 8 hours',
    difficulty: ['Beginner', 'Advanced', 'Pro'],
    tourDetails: [
      { day: 1, title: 'Arrival Day', description: 'Arrival at the airport (SOFIA or PLOVDIV) where you will be picked up and transferred to the Hotel in the mountains and sorting documentation and the paperwork.', image: 'assets/enduro-gallery/enduro-2.jpg' },
      { day: 2, title: 'Riding Day', description: "Day 2 begins with a fulfilling breakfast and personalized bike riding instructions. Once when everyone is comfortable on the bikes. We'll explore nice and easy tracks. We will take a break for lunch at local mountain restaurants between 1 pm and 2 pm. Our return to the hotel is scheduled for 5 pm, allowing for relaxation at the SPA and a delightful dinner.", image: 'assets/enduro-gallery/enduro-50.jpg' },
      { day: 3, title: 'Riding Day', description: 'After a refreshing breakfast, we embark on the bikes around 10 am, delving into a new array of tracks Midday brings a delightful break for lunch at local mountain restaurants from 1 pm to 2 pm, before our return to the hotel by 5 pm. Relax and unwind with the available SPA amenities before a sumptuous dinner.', image: 'assets/enduro-gallery/enduro-8.jpg' },
      { day: 4, title: 'Riding Day', description: 'Same set up but a very different route.', image: 'assets/enduro-gallery/enduro-8.jpg' },
      { day: 5, title: 'Departure Day', description: 'Breakfast, cheking out from the hotel and transfer back to the airport.', image: 'assets/enduro-gallery/enduro-12.jpg' },
    ],
  },
  {
    title: 'WEEKLONG ADVENTURE RETREAT',
    type: 'enduro' as const,
    promo: '',
    description: "Embark on a full week of adventure in the breathtaking mountains. Enjoy daily guided bike rides on scenic trails, test your skills at the shooting range, and experience high-speed go-karting. After each day's excitement, relax in the hotel SPA, savor delicious local cuisine, and create lasting memories in an unforgettable mountain getaway.",
    priceEur: 1800,
    priceGbp: 1570,
    promoPriceEur: 1650,
    promoPriceGbp: 1440,
    promoEndDate: '2026-02-25T23:59',
    image: 'assets/enduro-gallery/enduro-22.jpg',
    duration: '7 Days',
    durationDetails: '7 days (6 nights) from which 4 days are for riding',
    averageDistance: '60-120km per day - between 6 and 8 hours',
    difficulty: ['Beginner', 'Advanced', 'Pro'],
    tourDetails: [
      { day: 1, title: 'Arrival Day', description: 'Arrival at the airport (SOFIA or PLOVDIV) where you will be picked up and transferred to the hotel in the mountains. Sorting documentation and completing paperwork.', image: 'assets/enduro-gallery/enduro-2.jpg' },
      { day: 2, title: 'Riding Day', description: 'Breakfast and leaving with the bikes around 10 am, riding on various tracks and uphills. Lunch at local mountain restaurants between 1 pm and 2 pm. Return to the hotel at 5 pm to enjoy the SPA and dinner.', image: 'assets/enduro-gallery/enduro-50.jpg' },
      { day: 3, title: 'Riding Day', description: 'After breakfast, we embark on a new set of tracks and uphills. Lunch at local mountain restaurants from 1 pm to 2 pm. Return to the hotel by 5 pm for SPA relaxation and dinner.', image: 'assets/enduro-gallery/enduro-8.jpg' },
      { day: 4, title: 'Relaxing Day', description: 'Take a break from riding and spice up your day with a shooting range session and high-speed go-karting adventures.', image: 'assets/enduro-gallery/enduro-15.jpg' },
      { day: 5, title: 'Riding Day', description: 'Breakfast followed by exploring new tracks and challenging uphills around 10 am. Lunch at local mountain restaurants from 1 pm to 2 pm. Return to the hotel at 5 pm for SPA relaxation and dinner.', image: 'assets/enduro-gallery/enduro-50.jpg' },
      { day: 6, title: 'Riding Day', description: 'Another day of exciting rides on varied mountain tracks. Lunch at local restaurants between 1 pm and 2 pm, followed by return to the hotel for SPA and dinner.', image: 'assets/enduro-gallery/enduro-8.jpg' },
      { day: 7, title: 'Departure Day', description: 'On the final day, enjoy a shooting session at the gun range, followed by lunch and go-karting. Transfer to the airport for departure, ending the tour with adrenaline and memories.', image: 'assets/enduro-gallery/enduro-12.jpg' },
    ],
  },
  {
    title: 'FOUR-DAYS RIDING ADVENTURE',
    type: 'enduro' as const,
    description: 'Four days of nonstop riding action — tackle diverse terrain, enjoy camaraderie with fellow riders, and make every day an off-road adventure.',
    priceEur: 1200,
    priceGbp: 1040,
    image: 'assets/enduro-gallery/enduro-27.jpg',
    duration: '6 Days',
    durationDetails: '6 days (5 nights) from which 4 days are for riding',
    averageDistance: '60-120km per day - between 6 and 8 hours',
    difficulty: ['Beginner', 'Advanced', 'Pro'],
    tourDetails: [
      { day: 1, title: 'Arrival Day', description: 'Arrival at the airport (SOFIA or PLOVDIV) where you will be picked up and transferred to the hotel in the mountains. Sorting documentation and completing paperwork.', image: 'assets/enduro-gallery/enduro-2.jpg' },
      { day: 2, title: 'Riding Day', description: 'Breakfast and departure with the bikes around 10 am. Explore various tracks and uphills, with a lunch break at local mountain restaurants between 1 pm and 2 pm. Return to the hotel by 5 pm to relax in the SPA and enjoy dinner.', image: 'assets/enduro-gallery/enduro-50.jpg' },
      { day: 3, title: 'Riding Day', description: 'After breakfast, embark on new tracks and challenging uphills at 10 am. Enjoy lunch at local mountain restaurants from 1 pm to 2 pm. Return to the hotel by 5 pm for SPA relaxation and dinner.', image: 'assets/enduro-gallery/enduro-8.jpg' },
      { day: 4, title: 'Riding Day', description: 'Continue the adventure with a different set of routes and trails. Enjoy the scenery, take a lunch break at local mountain restaurants, and return to the hotel by 5 pm for relaxation and dinner.', image: 'assets/enduro-gallery/enduro-15.jpg' },
      { day: 5, title: 'Riding Day', description: 'Another exciting day on the bikes exploring new mountain tracks and trails. Lunch at local restaurants between 1 pm and 2 pm, followed by return to the hotel for SPA relaxation and dinner.', image: 'assets/enduro-gallery/enduro-50.jpg' },
      { day: 6, title: 'Departure Day', description: 'Breakfast, check-out from the hotel, and transfer back to the airport to conclude your adventure-filled retreat.', image: 'assets/enduro-gallery/enduro-12.jpg' },
    ],
  },
  {
    title: 'TWO DAYS RIDING ADVENTURE',
    type: 'enduro' as const,
    description: 'Enjoy an action-packed two-day ride — explore scenic trails, tackle exciting terrain, and experience the thrill of riding on two wheels.',
    priceEur: 900,
    priceGbp: 785,
    promoPriceEur: 850,
    promoPriceGbp: 740,
    promoEndDate: '2026-02-25T23:59',
    image: 'assets/enduro-gallery/enduro-52.jpg',
    duration: '4 Days',
    durationDetails: '4 days (3 nights) from which 2 days are for riding',
    averageDistance: '60-120km per day - between 6 and 8 hours',
    difficulty: ['Beginner', 'Advanced', 'Pro'],
    tourDetails: [
      { day: 1, title: 'Arrival Day', description: 'Arrival at the airport (SOFIA or PLOVDIV) where you will be picked up and transferred to the hotel in the mountains. Sorting documentation and completing paperwork.', image: 'assets/enduro-gallery/enduro-2.jpg' },
      { day: 2, title: 'Riding Day', description: 'Breakfast followed by departure with the bikes around 10 am. Ride on various tracks and uphills, with a lunch break at local mountain restaurants between 1 pm and 2 pm. Return to the hotel at 5 pm to relax in the SPA and enjoy dinner.', image: 'assets/enduro-gallery/enduro-50.jpg' },
      { day: 3, title: 'Riding Day', description: 'After breakfast, explore a very different route with new trails and challenges. Enjoy lunch at local restaurants, and return to the hotel by 5 pm for SPA relaxation and dinner.', image: 'assets/enduro-gallery/enduro-8.jpg' },
      { day: 4, title: 'Departure Day', description: 'Breakfast, check-out from the hotel, and transfer back to the airport to conclude your adventure.', image: 'assets/enduro-gallery/enduro-12.jpg' },
    ],
  },
];

const buggyTours = [
  {
    title: 'WEEKEND BUGGY BLAST',
    type: 'buggy' as const,
    promo: '',
    description: 'Hit the dirt trails in a powerful off-road buggy — two days of mountain action, stunning views, and pure adrenaline on four wheels.',
    priceEur: 950,
    priceGbp: 830,
    image: 'assets/enduro-gallery/enduro-22.jpg',
    duration: '4 Days',
    durationDetails: '4 days (3 nights) from which 2 days are for driving',
    averageDistance: '80-150km per day - between 5 and 7 hours',
    difficulty: ['Beginner', 'Advanced'],
    tourDetails: [
      { day: 1, title: 'Arrival Day', description: 'Arrival at the airport (SOFIA or PLOVDIV) where you will be picked up and transferred to the Hotel in the mountains and sorting documentation and the paperwork.', image: 'assets/enduro-gallery/enduro-5.jpg' },
      { day: 2, title: 'Driving Day', description: 'Breakfast and safety briefing on the buggies around 10 am. Head out on mountain trails and forest tracks, lunch at local mountain restaurants between 13pm-14pm and coming back to the hotel at 17pm. Enjoy the SPA and dinner.', image: 'assets/enduro-gallery/enduro-10.jpg' },
      { day: 3, title: 'Driving Day', description: 'Same set up but a completely different route with new terrain and challenges.', image: 'assets/enduro-gallery/enduro-15.jpg' },
      { day: 4, title: 'Departure Day', description: 'Final day with departure arrangements and transfer to airport.', image: 'assets/enduro-gallery/enduro-20.jpg' },
    ],
  },
  {
    title: 'BUGGY MOUNTAIN EXPLORER',
    type: 'buggy' as const,
    promo: '',
    description: 'A thrilling 3-day buggy expedition through the Pirin Mountains — conquer rugged trails, river crossings, and breathtaking mountain passes.',
    priceEur: 1200,
    priceGbp: 1045,
    image: 'assets/enduro-gallery/enduro-27.jpg',
    duration: '5 Days',
    durationDetails: '5 days (4 nights) from which 3 days are for driving',
    averageDistance: '80-150km per day - between 5 and 7 hours',
    difficulty: ['Beginner', 'Advanced', 'Pro'],
    tourDetails: [
      { day: 1, title: 'Arrival Day', description: 'Arrival at the airport (SOFIA or PLOVDIV) where you will be picked up and transferred to the Hotel in the mountains and sorting documentation and the paperwork.', image: 'assets/enduro-gallery/enduro-25.jpg' },
      { day: 2, title: 'Driving Day', description: 'Breakfast and buggy briefing around 10 am. Explore mountain trails with stunning views, lunch at local mountain restaurants between 13pm-14pm and coming back to the hotel at 17pm. Enjoy the SPA and dinner.', image: 'assets/enduro-gallery/enduro-30.jpg' },
      { day: 3, title: 'Driving Day', description: 'After a refreshing breakfast, we head out around 10 am on a new set of trails including river crossings and forest tracks. Lunch at local mountain restaurants from 1 pm to 2 pm, before our return to the hotel by 17pm. Relax with the SPA amenities before dinner.', image: 'assets/enduro-gallery/enduro-35.jpg' },
      { day: 4, title: 'Driving Day', description: 'Same set up but a very different route with the most challenging terrain of the trip.', image: 'assets/enduro-gallery/enduro-40.jpg' },
      { day: 5, title: 'Departure Day', description: 'Breakfast, checking out from the hotel and transfer back to the airport.', image: 'assets/enduro-gallery/enduro-45.jpg' },
    ],
  },
  {
    title: 'ULTIMATE BUGGY ADVENTURE',
    type: 'buggy' as const,
    description: 'The full buggy experience — a week of off-road driving through mountains, forests, and valleys. Includes a relaxation day with go-karting and shooting range.',
    priceEur: 1900,
    priceGbp: 1655,
    image: 'assets/enduro-gallery/enduro-50.jpg',
    duration: '7 Days',
    durationDetails: '7 days (6 nights) from which 4 days are for driving',
    averageDistance: '80-150km per day - between 5 and 7 hours',
    difficulty: ['Beginner', 'Advanced', 'Pro'],
    tourDetails: [
      { day: 1, title: 'Arrival Day', description: 'Arrival at the airport (SOFIA or PLOVDIV) where you will be picked up and transferred to the hotel in the mountains. Sorting documentation and completing paperwork.', image: 'assets/enduro-gallery/enduro-2.jpg' },
      { day: 2, title: 'Driving Day', description: 'Breakfast and buggy briefing around 10 am. Head out on varied mountain trails, lunch at local mountain restaurants between 1 pm and 2 pm. Return to the hotel at 5 pm to enjoy the SPA and dinner.', image: 'assets/enduro-gallery/enduro-50.jpg' },
      { day: 3, title: 'Driving Day', description: 'After breakfast, we tackle a new set of tracks and challenging terrain. Lunch at local mountain restaurants from 1 pm to 2 pm. Return to the hotel by 5 pm for SPA relaxation and dinner.', image: 'assets/enduro-gallery/enduro-8.jpg' },
      { day: 4, title: 'Relaxing Day', description: 'Take a break from driving and spice up your day with a shooting range session and high-speed go-karting adventures.', image: 'assets/enduro-gallery/enduro-15.jpg' },
      { day: 5, title: 'Driving Day', description: 'Breakfast followed by exploring new trails and river crossings around 10 am. Lunch at local mountain restaurants from 1 pm to 2 pm. Return to the hotel at 5 pm for SPA relaxation and dinner.', image: 'assets/enduro-gallery/enduro-50.jpg' },
      { day: 6, title: 'Driving Day', description: 'Another day of exciting drives on varied mountain tracks. Lunch at local restaurants between 1 pm and 2 pm, followed by return to the hotel for SPA and dinner.', image: 'assets/enduro-gallery/enduro-8.jpg' },
      { day: 7, title: 'Departure Day', description: 'On the final day, enjoy a shooting session at the gun range, followed by lunch and go-karting. Transfer to the airport for departure.', image: 'assets/enduro-gallery/enduro-12.jpg' },
    ],
  },
];

async function seed() {
  await dataSource.initialize();
  console.log('Database connected');

  const tourRepo = dataSource.getRepository(Tour);

  // Admins are defined via env vars (ADMIN_USERNAME + ADMIN_PASSWORD_HASH, etc.) —
  // no DB seeding required. Auth service reads them directly at request time.

  // Seed tours
  const forceReseed = process.argv.includes('--force');
  const existingTours = await tourRepo.count();

  if (forceReseed && existingTours > 0) {
    await tourRepo.clear();
    console.log('Existing tours cleared');
  }

  if (forceReseed || existingTours === 0) {
    const allTours = [...enduroTours, ...buggyTours];
    for (const tourData of allTours) {
      await tourRepo.save(tourRepo.create(tourData));
    }
    console.log(`${allTours.length} tours seeded`);
  } else {
    console.log(`Tours already exist (${existingTours} found), skipping seed`);
  }

  await dataSource.destroy();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
