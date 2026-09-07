export function generateBookingNumber(): string {
  const date = new Date();
  const prefix = 'BK';
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(nights, 1);
}