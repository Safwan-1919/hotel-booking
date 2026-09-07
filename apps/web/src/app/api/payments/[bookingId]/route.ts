import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { requireAuth } from '@/lib/server/auth';
import { createPaymentSchema } from '@/lib/server/validation';
import { handleError } from '@/lib/server/http';
import { AppError } from '@/lib/server/errors';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const user = await requireAuth(req);
    const { bookingId } = await params;
    const data = createPaymentSchema.parse(await req.json());

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status === 'CANCELLED') throw new AppError(400, 'Cannot pay for cancelled booking');

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentType: data.paymentType || 'ROOM_CHARGE',
        reference: data.reference,
        notes: data.notes,
        processedBy: user.email,
      },
    });

    const totalPaid = await prisma.payment.aggregate({
      where: { bookingId },
      _sum: { amount: true },
    });
    const paid = Number(totalPaid._sum.amount || 0);
    let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'UNPAID';
    if (paid >= Number(booking.totalAmount)) paymentStatus = 'PAID';
    else if (paid > 0) paymentStatus = 'PARTIAL';

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus,
        paidAmount: paid,
        paymentMethod: data.paymentMethod,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}