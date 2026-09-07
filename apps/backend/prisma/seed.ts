import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotel.com' },
    update: {},
    create: {
      email: 'admin@hotel.com',
      password: adminPassword,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'ADMIN',
      phone: '+919876543210',
    },
  });
  console.log('Admin user created:', admin.email);

  const receptionistPassword = await bcrypt.hash('receptionist123', 12);
  const receptionist = await prisma.user.upsert({
    where: { email: 'reception@hotel.com' },
    update: {},
    create: {
      email: 'reception@hotel.com',
      password: receptionistPassword,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: 'RECEPTIONIST',
      phone: '+919876543211',
    },
  });
  console.log('Receptionist created:', receptionist.email);

  const roomTypes = await Promise.all([
    prisma.roomType.upsert({
      where: { name: 'Standard Single' },
      update: {},
      create: {
        name: 'Standard Single',
        description: 'Comfortable single room with essential amenities',
        basePrice: 2499,
        maxGuests: 1,
        bedType: 'single',
        size: '18 sqm',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Safe'],
      },
    }),
    prisma.roomType.upsert({
      where: { name: 'Standard Double' },
      update: {},
      create: {
        name: 'Standard Double',
        description: 'Spacious double room for solo travelers or couples',
        basePrice: 3499,
        maxGuests: 2,
        bedType: 'double',
        size: '24 sqm',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Coffee Maker'],
      },
    }),
    prisma.roomType.upsert({
      where: { name: 'Deluxe Double' },
      update: {},
      create: {
        name: 'Deluxe Double',
        description: 'Premium double room with city views',
        basePrice: 4999,
        maxGuests: 2,
        bedType: 'queen',
        size: '30 sqm',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Coffee Maker', 'Bathtub', 'City View'],
      },
    }),
    prisma.roomType.upsert({
      where: { name: 'Junior Suite' },
      update: {},
      create: {
        name: 'Junior Suite',
        description: 'Suite with separate living area',
        basePrice: 7499,
        maxGuests: 3,
        bedType: 'queen',
        size: '42 sqm',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Coffee Maker', 'Bathtub', 'Living Area', 'City View'],
      },
    }),
    prisma.roomType.upsert({
      where: { name: 'Executive Suite' },
      update: {},
      create: {
        name: 'Executive Suite',
        description: 'Luxury suite with panoramic views and premium amenities',
        basePrice: 12999,
        maxGuests: 4,
        bedType: 'king',
        size: '58 sqm',
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Safe', 'Coffee Maker', 'Jacuzzi', 'Living Area', 'Panoramic View', 'Nespresso Machine'],
      },
    }),
  ]);
  console.log(`${roomTypes.length} room types created`);

  const floors = ['GROUND', 'FIRST', 'SECOND', 'THIRD'] as const;
  const roomTypePool = [
    roomTypes[0], roomTypes[0], roomTypes[0], roomTypes[0], roomTypes[0],
    roomTypes[1], roomTypes[1], roomTypes[1], roomTypes[1], roomTypes[1],
    roomTypes[1], roomTypes[1], roomTypes[1], roomTypes[1], roomTypes[1],
    roomTypes[2], roomTypes[2], roomTypes[2], roomTypes[2], roomTypes[2],
    roomTypes[2], roomTypes[2], roomTypes[2],
    roomTypes[3], roomTypes[3], roomTypes[3], roomTypes[3],
    roomTypes[4], roomTypes[4], roomTypes[4],
  ];

  const floorPrefix = { GROUND: 'G', FIRST: '1', SECOND: '2', THIRD: '3' };
  let roomCount = 0;

  for (const floor of floors) {
    for (let i = 1; i <= 8; i++) {
      if (roomCount >= roomTypePool.length) break;
      const roomNumber = `${floorPrefix[floor]}${String(i).padStart(2, '0')}`;
      await prisma.room.upsert({
        where: { roomNumber },
        update: {},
        create: {
          roomNumber,
          floor,
          roomTypeId: roomTypePool[roomCount].id,
          status: 'AVAILABLE',
        },
      });
      roomCount++;
    }
  }
  console.log(`${roomCount} rooms created`);

  const services = await Promise.all([
    prisma.service.upsert({
      where: { name: 'Room Service - Breakfast' },
      update: {},
      create: { name: 'Room Service - Breakfast', description: 'In-room South Indian / North Indian breakfast', price: 350, category: 'FOOD' },
    }),
    prisma.service.upsert({
      where: { name: 'Room Service - Thali' },
      update: {},
      create: { name: 'Room Service - Thali', description: 'Full course thali meal (Veg/Non-Veg)', price: 550, category: 'FOOD' },
    }),
    prisma.service.upsert({
      where: { name: 'Spa Massage' },
      update: {},
      create: { name: 'Spa Massage', description: '60-minute Ayurvedic full body massage', price: 1500, category: 'SPA' },
    }),
    prisma.service.upsert({
      where: { name: 'Airport Transfer' },
      update: {},
      create: { name: 'Airport Transfer', description: 'AC sedan one-way airport pickup/drop', price: 800, category: 'TRANSPORT' },
    }),
    prisma.service.upsert({
      where: { name: 'Laundry - Wash & Iron' },
      update: {},
      create: { name: 'Laundry - Wash & Iron', description: 'Per piece laundry service', price: 50, category: 'LAUNDRY' },
    }),
    prisma.service.upsert({
      where: { name: 'Late Checkout' },
      update: {},
      create: { name: 'Late Checkout', description: 'Extended checkout until 4 PM', price: 500, category: 'OTHER' },
    }),
    prisma.service.upsert({
      where: { name: 'Minibar Snacks' },
      update: {},
      create: { name: 'Minibar Snacks', description: 'Chips, chocolates, and beverages pack', price: 250, category: 'MINIBAR' },
    }),
  ]);
  console.log(`${services.length} services created`);

  const guests = await Promise.all([
    prisma.guest.create({
      data: {
        firstName: 'Arjun',
        lastName: 'Mehta',
        email: 'arjun.mehta@gmail.com',
        phone: '+919820112233',
        idType: 'aadhaar',
        idNumber: '1234-5678-9012',
        nationality: 'Indian',
      },
    }),
    prisma.guest.create({
      data: {
        firstName: 'Sneha',
        lastName: 'Iyer',
        email: 'sneha.iyer@yahoo.com',
        phone: '+919845098765',
        idType: 'passport',
        idNumber: 'R7890123',
        nationality: 'Indian',
      },
    }),
    prisma.guest.create({
      data: {
        firstName: 'Vikram',
        lastName: 'Patel',
        email: 'vikram.patel@outlook.com',
        phone: '+919765432109',
        idType: 'drivers_license',
        idNumber: 'GJ0123456789',
        nationality: 'Indian',
      },
    }),
  ]);
  console.log(`${guests.length} sample guests created`);

  console.log('\nSeeding complete!');
  console.log('\nLogin credentials:');
  console.log('  Admin:         admin@hotel.com / admin123');
  console.log('  Receptionist:  reception@hotel.com / receptionist123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
