import { v4 as uuidv4 } from 'uuid';

export function generateBookingNumber(): string {
  const date = new Date();
  const prefix = 'BK';
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const randomPart = uuidv4().substring(0, 6).toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

export function generateRoomNumber(floor: string, roomNum: number): string {
  const floorMap: Record<string, string> = {
    GROUND: 'G',
    FIRST: '1',
    SECOND: '2',
    THIRD: '3',
    FOURTH: '4',
  };
  return `${floorMap[floor] || 'G'}${String(roomNum).padStart(2, '0')}`;
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(nights, 1);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function paginate(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}
