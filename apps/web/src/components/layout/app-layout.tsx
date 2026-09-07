'use client';

import React from 'react';
import Sidebar from './sidebar';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="hidden lg:block fixed top-0 left-0 z-50 h-full w-[260px] bg-sidebar">
          <div className="flex items-center h-14 px-5 border-b border-white/10">
            <div className="shimmer h-5 w-24 bg-white/10" />
          </div>
          <div className="p-3 space-y-1">
            {[1,2,3,4,5,6,7].map((i) => (
              <div key={i} className="shimmer h-9 w-full rounded-md bg-white/5" />
            ))}
          </div>
        </div>
        <div className="lg:ml-[260px] min-h-screen pt-14 lg:pt-0 p-4 sm:p-5 lg:p-7">
          <div className="max-w-[1400px] space-y-6">
            <div className="shimmer h-7 w-32 mb-1.5" />
            <div className="shimmer h-4 w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="stat-card">
                  <div className="shimmer h-3 w-20 mb-3" />
                  <div className="shimmer h-8 w-24 mb-1" />
                  <div className="shimmer h-3 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <main className="lg:ml-[260px] min-h-screen pt-14 lg:pt-0">
        <div className="p-4 sm:p-5 lg:p-7 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
