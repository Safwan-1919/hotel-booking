import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './errors';

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation error',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 },
    );
  }
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: err.message, details: err.details },
      { status: err.statusCode },
    );
  }
  console.error('Unhandled error:', err);
  return NextResponse.json(
    {
      error: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        details: err instanceof Error ? err.message : String(err),
      }),
    },
    { status: 500 },
  );
}