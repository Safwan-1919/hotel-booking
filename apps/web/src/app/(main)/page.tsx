'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, RadialBarChart, RadialBar,
} from 'recharts';

interface DashboardData {
  rooms: { total: number; available: number; occupied: number; reserved: number; maintenance: number; cleaning: number; occupancyRate: number };
  bookings: { todayCheckIns: number; todayCheckOuts: number; currentGuests: number; monthlyBookings: number };
  revenue: { today: number; monthly: number };
  payments: { pendingCount: number; pendingAmount: number };
  totalGuests: number;
  recentBookings: Array<{
    id: string; bookingNumber: string; status: string; checkInDate: string; checkOutDate: string; totalAmount: string;
    guest: { firstName: string; lastName: string };
    room: { roomNumber: string; roomType: { name: string } };
  }>;
  roomTypeDistribution: Array<{ name: string; _count: { rooms: number } }>;
  bookingsBySource: Array<{ source: string; _count: number }>;
  bookingsByStatus: Array<{ status: string; _count: number }>;
  paymentsByMethod: Array<{ method: string; _sum: { amount: string | null }; _count: number }>;
  dailyRevenue: Array<{ date: string; amount: number }>;
}

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  muted: 'hsl(var(--muted-foreground))',
  accent: 'hsl(var(--accent))',
  destructive: 'hsl(var(--destructive))',
  palette: ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'],
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-2.5 shadow-sm">
      <p className="text-xs font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          {entry.name}: <span className="font-medium text-foreground">{typeof entry.value === 'number' && entry.value > 999 ? formatCurrency(entry.value) : entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>('/dashboard').then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><div className="shimmer h-7 w-32 mb-1.5" /><div className="shimmer h-4 w-48" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <div className="shimmer h-3 w-20" />
                <div className="shimmer h-8 w-8 rounded-lg" />
              </div>
              <div className="shimmer h-8 w-24 mb-1" />
              <div className="shimmer h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="stat-card"><div className="shimmer h-3 w-28 mb-4" /><div className="shimmer h-48 w-full rounded-lg" /></div>
          <div className="stat-card"><div className="shimmer h-3 w-28 mb-4" /><div className="shimmer h-48 w-full rounded-lg" /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map((i) => (
            <div key={i} className="stat-card"><div className="shimmer h-3 w-28 mb-4" /><div className="shimmer h-44 w-full rounded-lg" /></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-12 text-muted-foreground text-sm">Failed to load dashboard</div>;

  const occupancyData = [
    { name: 'Occupied', value: data.rooms.occupied, fill: CHART_COLORS.primary },
    { name: 'Reserved', value: data.rooms.reserved, fill: CHART_COLORS.accent },
    { name: 'Available', value: data.rooms.available, fill: '#e2e8f0' },
    { name: 'Maintenance', value: data.rooms.maintenance, fill: CHART_COLORS.muted },
    { name: 'Cleaning', value: data.rooms.cleaning, fill: '#94a3b8' },
  ].filter((d) => d.value > 0);

  const roomTypeData = (data.roomTypeDistribution || []).map((rt) => ({
    name: rt.name,
    count: rt._count.rooms,
  }));

  const sourceData = (data.bookingsBySource || []).map((bs) => ({
    name: bs.source.replace('_', ' '),
    value: bs._count,
  }));

  const statusData = (data.bookingsByStatus || []).map((bs) => ({
    name: bs.status.replace('_', ' '),
    count: bs._count,
  }));

  const paymentMethodData = (data.paymentsByMethod || []).map((pm) => ({
    name: pm.method.replace('_', ' '),
    amount: Number(pm._sum.amount || 0),
    count: pm._count,
  }));

  const statCards = [
    { label: 'Occupancy', value: `${data.rooms.occupancyRate}%`, sub: `${data.rooms.occupied + data.rooms.reserved}/${data.rooms.total} rooms`, icon: 'bx-trending-up' as const },
    { label: 'Revenue Today', value: formatCurrency(data.revenue.today), sub: `Monthly: ${formatCurrency(data.revenue.monthly)}`, icon: 'bx-dollar' as const },
    { label: 'Check-ins', value: data.bookings.todayCheckIns, sub: `Check-outs: ${data.bookings.todayCheckOuts}`, icon: 'bx-right-arrow-alt' as const },
    { label: 'Pending', value: data.payments.pendingCount, sub: `${formatCurrency(data.payments.pendingAmount)} due`, icon: 'bx-error' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Hotel operations overview</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                <Icon name={s.icon} className="text-base text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Room Occupancy</p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {occupancyData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {occupancyData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t flex items-center justify-between text-xs">
                <span className="font-medium">Total</span>
                <span className="font-bold text-base">{data.rooms.total}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Daily Revenue</p>
          <div className="h-44">
            {(data.dailyRevenue || []).length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No revenue data this month</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyRevenue || []}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v).getDate().toString()}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Room Types</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomTypeData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Rooms" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Booking Sources</p>
          <div className="h-44">
            {sourceData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No bookings this month</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={24}
                    iconType="circle"
                    iconSize={6}
                    formatter={(value: string) => <span className="text-[10px] text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Booking Status</p>
          <div className="h-44">
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No bookings this month</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ left: -10, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={25}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Bookings" radius={[4, 4, 0, 0]} barSize={24}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {paymentMethodData.length > 0 && (
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Payments by Method</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]} barSize={32}>
                  {paymentMethodData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS.palette[i % CHART_COLORS.palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="stat-card">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Recent Bookings</p>
        {data.recentBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent bookings</p>
        ) : (
          <div className="space-y-1.5">
            {data.recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-xs font-medium text-primary">
                    {booking.guest.firstName[0]}{booking.guest.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {booking.guest.firstName} {booking.guest.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Room {booking.room.roomNumber} &middot; {booking.room.roomType.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(booking.status)}>{booking.status.replace('_', ' ')}</Badge>
                  <p className="text-[11px] text-muted-foreground mt-1">{formatDate(booking.checkInDate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
