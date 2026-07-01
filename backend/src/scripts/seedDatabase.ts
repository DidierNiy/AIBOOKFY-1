import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import Listing from '../models/Listing';

const DEFAULT_USERS = [
  {
    email: 'hotel@aibookify.com',
    password: 'Hotel@1234',
    role: 'hotelManager' as const,
    isVerified: true,
    paymentStatus: 'confirmed' as const,
    plan: 'pro',
  },
  {
    email: 'traveler@aibookify.com',
    password: 'Travel@1234',
    role: 'traveler' as const,
    isVerified: true,
    paymentStatus: 'confirmed' as const,
  },
];

const SAMPLE_HOTELS = [
  {
    name: 'Bujumbura Beachfront Resort',
    description: 'A stunning lakeside resort on the shores of Lake Tanganyika, offering breathtaking sunset views, a private beach, and world-class amenities.',
    location: 'Bujumbura, Burundi',
    price: 95,
    amenities: ['Pool', 'Free WiFi', 'Beach Access', 'Restaurant', 'Bar', 'Room Service', 'Parking'],
    images: [
      'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    rating: 4.5,
    isActive: true,
  },
  {
    name: 'The Urban Oasis Hotel',
    description: 'A boutique city-center hotel blending modern design with local charm. Perfect for business travelers and urban explorers alike.',
    location: 'Downtown Bujumbura, Burundi',
    price: 120,
    amenities: ['Gym', 'Spa', 'Rooftop Bar', 'Free WiFi', 'Conference Rooms', 'Airport Shuttle'],
    images: [
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    rating: 4.8,
    isActive: true,
  },
  {
    name: 'Lake Tanganyika Lodge',
    description: 'Eco-friendly lodge nestled in lush gardens with direct lake access. Experience authentic Burundian hospitality in a peaceful setting.',
    location: 'Bujumbura, Burundi',
    price: 75,
    amenities: ['Lake View', 'Free WiFi', 'Garden', 'Restaurant', 'Kayaking', 'Fishing'],
    images: [
      'https://images.pexels.com/photos/261395/pexels-photo-261395.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    rating: 4.2,
    isActive: true,
  },
  {
    name: 'Nairobi Grand Hotel',
    description: 'Five-star luxury in the heart of Nairobi. Impeccable service, fine dining, and panoramic city views from every room.',
    location: 'Nairobi, Kenya',
    price: 180,
    amenities: ['Pool', 'Spa', 'Fine Dining', 'Free WiFi', 'Gym', 'Concierge', 'Valet Parking', 'Business Center'],
    images: [
      'https://images.pexels.com/photos/1458457/pexels-photo-1458457.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2869215/pexels-photo-2869215.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    rating: 4.9,
    isActive: true,
  },
  {
    name: 'Kigali Heights Boutique Hotel',
    description: 'A sophisticated boutique hotel perched above the City of a Thousand Hills. Enjoy stunning views of Kigali\'s rolling landscape.',
    location: 'Kigali, Rwanda',
    price: 110,
    amenities: ['Rooftop Pool', 'Free WiFi', 'Restaurant', 'Bar', 'Airport Transfer', 'Gym'],
    images: [
      'https://images.pexels.com/photos/2096983/pexels-photo-2096983.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3225531/pexels-photo-3225531.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    rating: 4.6,
    isActive: true,
  },
  {
    name: 'Dar es Salaam Seaside Inn',
    description: 'Charming inn steps from the Indian Ocean. Wake up to the sound of waves and enjoy fresh seafood at our waterfront restaurant.',
    location: 'Dar es Salaam, Tanzania',
    price: 85,
    amenities: ['Ocean View', 'Free WiFi', 'Seafood Restaurant', 'Bar', 'Beach Access', 'Snorkeling'],
    images: [
      'https://images.pexels.com/photos/2373201/pexels-photo-2373201.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2034335/pexels-photo-2034335.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    rating: 4.3,
    isActive: true,
  },
  {
    name: 'Kampala Business Suites',
    description: 'Modern serviced suites designed for the business traveler. Fully equipped kitchenettes, high-speed WiFi, and a prime central location.',
    location: 'Kampala, Uganda',
    price: 95,
    amenities: ['Kitchenette', 'Free WiFi', 'Gym', 'Business Center', 'Laundry', 'Parking', '24hr Reception'],
    images: [
      'https://images.pexels.com/photos/2725675/pexels-photo-2725675.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    rating: 4.4,
    isActive: true,
  },
  {
    name: 'Zanzibar Beach Palace',
    description: 'Luxury beachfront palace on Zanzibar\'s pristine white-sand coast. Swim in crystal-clear turquoise waters and indulge in Swahili cuisine.',
    location: 'Zanzibar, Tanzania',
    price: 220,
    amenities: ['Private Beach', 'Infinity Pool', 'Spa', 'Diving Center', 'Free WiFi', 'Water Sports', 'Fine Dining'],
    images: [
      'https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800',
    ],
    rating: 4.9,
    isActive: true,
  },
];

export async function seedDatabase(force = false): Promise<void> {
  console.log('[Seed] Checking if database needs seeding...');

  const userCount = await User.countDocuments();
  const listingCount = await Listing.countDocuments();

  if (!force && userCount > 0 && listingCount > 0) {
    console.log(`[Seed] Database already has ${userCount} users and ${listingCount} listings. Skipping.`);
    return;
  }

  console.log('[Seed] Seeding database...');

  // Upsert default users
  const seededUsers: Record<string, mongoose.Types.ObjectId> = {};
  for (const u of DEFAULT_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      { ...u, password: hashed },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seededUsers[u.role] = doc._id as mongoose.Types.ObjectId;
    console.log(`[Seed] User ready: ${u.email} (${u.role})`);
  }

  const hotelManagerId = seededUsers['hotelManager'].toString();

  // Upsert hotel listings
  for (const hotel of SAMPLE_HOTELS) {
    await Listing.findOneAndUpdate(
      { name: hotel.name, location: hotel.location },
      { ...hotel, ownerId: hotelManagerId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log(`[Seed] Done. Seeded ${SAMPLE_HOTELS.length} hotels.`);
  console.log('[Seed] Default credentials:');
  console.log('  Hotel Manager → hotel@aibookify.com / Hotel@1234');
  console.log('  Traveler      → traveler@aibookify.com / Travel@1234');
}
