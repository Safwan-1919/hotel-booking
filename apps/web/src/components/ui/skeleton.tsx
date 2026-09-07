import React from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer', className)} />;
}

export { Skeleton };
