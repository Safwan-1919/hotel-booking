import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'RECEPTIONIST']).default('RECEPTIONIST'),
});

export const createGuestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required'),
  idType: z.string().min(1, 'ID type is required'),
  idNumber: z.string().min(1, 'ID number is required'),
  address: z.any().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  notes: z.string().optional(),
});

export const createRoomTypeSchema = z.object({
  name: z.string().min(1, 'Room type name is required'),
  description: z.string().optional(),
  basePrice: z.number().positive('Price must be positive'),
  maxGuests: z.number().int().min(1).default(2),
  bedType: z.string().min(1, 'Bed type is required'),
  size: z.string().optional(),
  amenities: z.array(z.string()).default([]),
});

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  floor: z.enum(['GROUND', 'FIRST', 'SECOND', 'THIRD', 'FOURTH']),
  roomTypeId: z.string().uuid('Invalid room type ID'),
  notes: z.string().optional(),
});

export const updateRoomStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'CLEANING', 'OUT_OF_ORDER']),
  notes: z.string().optional(),
});

export const createBookingSchema = z.object({
  guestId: z.string().uuid('Invalid guest ID'),
  roomId: z.string().uuid('Invalid room ID'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  source: z.enum(['WALK_IN', 'PHONE', 'WEBSITE', 'OTA', 'AGENT', 'CORPORATE']).default('WALK_IN'),
  roomRate: z.number().positive('Room rate must be positive'),
  discount: z.number().min(0).default(0),
  specialRequests: z.string().optional(),
  internalNotes: z.string().optional(),
});

export const checkInSchema = z.object({
  actualCheckIn: z.string().optional(),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  actualCheckOut: z.string().optional(),
  notes: z.string().optional(),
  damages: z.string().optional(),
});

export const createPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER']),
  paymentType: z.enum(['ROOM_CHARGE', 'DEPOSIT', 'EXTRA_SERVICE', 'REFUND', 'OTHER']).default('ROOM_CHARGE'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
});

export const addBookingServiceSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  quantity: z.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
