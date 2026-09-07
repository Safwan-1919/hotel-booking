'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-32 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-32 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/[0.03] rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/[0.03] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col justify-between px-16 xl:px-20 py-12 w-full">
          <div>
            <h1 className="font-logo text-6xl xl:text-7xl text-white mb-2">HotelPMS</h1>
            <div className="w-20 h-[2px] bg-gradient-to-r from-white/40 to-transparent mt-4 mb-6" />
          </div>

          <div className="space-y-8">
            <p className="text-slate-300/80 text-base leading-relaxed max-w-sm">
              Everything you need to run your hotel — bookings, rooms, guests, payments — all in one place.
            </p>

            <div className="grid grid-cols-3 gap-6">
              {[
                { number: '30+', label: 'Rooms' },
                { number: '3', label: 'Floors' },
                { number: '24/7', label: 'Access' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-white mb-1">{stat.number}</p>
                  <p className="text-[11px] text-slate-500 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
              <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">PMS</p>
              <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
                <Icon name="bx-map" className="text-sm text-white/30" />
              </div>
              <div>
                <p className="text-xs text-white/50">HotelPMS</p>
                <p className="text-[10px] text-slate-600">Property Management System</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden text-center mb-10">
            <h1 className="font-logo text-5xl sm:text-6xl text-slate-900 mb-2">HotelPMS</h1>
            <div className="w-12 h-0.5 bg-slate-300 mx-auto mt-4" />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-2">Sign in to your account</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                  <Icon name="bx-error-circle" className="text-lg flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <div className="relative">
                  <Icon name="bx-envelope" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@hotel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Icon name="bx-lock-alt" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 rounded-xl border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Icon name={showPassword ? 'bx-hide' : 'bx-show'} className="text-lg" />
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-slate-900/20"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="shimmer h-4 w-4 rounded bg-white/30" />
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/60 border border-slate-200/50 backdrop-blur-sm">
            <p className="text-xs font-semibold text-slate-600 mb-2.5 uppercase tracking-wider">Demo Credentials</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Admin</span>
                <code className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">admin@hotel.com / admin123</code>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Reception</span>
                <code className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">reception@hotel.com / receptionist123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
