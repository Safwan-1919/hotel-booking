import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: 'bg-primary/10 text-primary',
    OCCUPIED: 'bg-destructive/10 text-destructive',
    RESERVED: 'bg-primary/10 text-primary',
    MAINTENANCE: 'bg-muted text-muted-foreground',
    CLEANING: 'bg-muted text-muted-foreground',
    OUT_OF_ORDER: 'bg-destructive/10 text-destructive',
    PENDING: 'bg-muted text-muted-foreground',
    CONFIRMED: 'bg-primary/10 text-primary',
    CHECKED_IN: 'bg-primary/10 text-primary',
    CHECKED_OUT: 'bg-muted text-muted-foreground',
    CANCELLED: 'bg-destructive/10 text-destructive',
    NO_SHOW: 'bg-destructive/10 text-destructive',
    UNPAID: 'bg-destructive/10 text-destructive',
    PARTIAL: 'bg-muted text-muted-foreground',
    PAID: 'bg-primary/10 text-primary',
    REFUNDED: 'bg-muted text-muted-foreground',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}
