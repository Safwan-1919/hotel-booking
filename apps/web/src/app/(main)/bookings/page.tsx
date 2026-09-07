'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate, getStatusColor, calculateNights } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Booking {
  id: string; bookingNumber: string; status: string; paymentStatus: string;
  checkInDate: string; checkOutDate: string; adults: number; children: number;
  roomRate: string; totalAmount: string; paidAmount: string; source: string;
  guest: { id: string; firstName: string; lastName: string; phone: string };
  room: { roomNumber: string; roomType: { name: string } };
}
interface Guest { id: string; firstName: string; lastName: string; phone: string; }
interface Room { id: string; roomNumber: string; status: string; roomType: { name: string; basePrice: string } }

const CHART_PALETTE = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-2.5 shadow-sm">
      <p className="text-xs font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-muted-foreground">
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [newBooking, setNewBooking] = useState({ guestId: '', roomId: '', checkInDate: '', checkOutDate: '', adults: 1, children: 0, roomRate: 0, source: 'WALK_IN', specialRequests: '' });

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (search) params.set('search', search);
      const data = await api.get<{ bookings: Booking[] }>(`/bookings?${params}`);
      setBookings(data.bookings);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [filterStatus, search]);

  useEffect(() => {
    fetchBookings();
    api.get<{ guests: Guest[] }>('/guests?limit=100').then((d) => setGuests(d.guests || [])).catch(console.error);
    api.get<{ rooms: Room[] }>('/rooms?limit=100&status=AVAILABLE').then((d) => setRooms(d.rooms || [])).catch(console.error);
  }, [fetchBookings]);

  const handleCreateBooking = async () => {
    try {
      await api.post('/bookings', { ...newBooking, roomRate: Number(newBooking.roomRate), adults: Number(newBooking.adults), children: Number(newBooking.children) });
      setAddDialogOpen(false); fetchBookings();
    } catch (err: any) { alert(err.message); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    try { await api.post(`/bookings/${id}/cancel`); fetchBookings(); } catch (err: any) { alert(err.message); }
  };

  const statusCounts = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});
  const sourceCounts = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.source] = (acc[b.source] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusCounts).map(([name, count]) => ({ name: name.replace('_', ' '), value: count }));
  const sourceChartData = Object.entries(sourceCounts).map(([name, count]) => ({ name: name.replace('_', ' '), value: count }));

  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage reservations</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Icon name="bx-plus" className="text-lg mr-1" />New Booking</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Booking</DialogTitle><DialogDescription>Fill in reservation details</DialogDescription></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Guest</Label>
                <Select value={newBooking.guestId} onValueChange={(v) => setNewBooking({ ...newBooking, guestId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select guest" /></SelectTrigger>
                  <SelectContent>{guests.map((g) => <SelectItem key={g.id} value={g.id}>{g.firstName} {g.lastName} — {g.phone}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Room</Label>
                <Select value={newBooking.roomId} onValueChange={(v) => { const r = rooms.find((r) => r.id === v); setNewBooking({ ...newBooking, roomId: v, roomRate: r ? Number(r.roomType.basePrice) : 0 }); }}>
                  <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>{rooms.map((r) => <SelectItem key={r.id} value={r.id}>{r.roomNumber} — {r.roomType.name} ({formatCurrency(Number(r.roomType.basePrice))})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Check-in</Label><Input type="date" value={newBooking.checkInDate} onChange={(e) => setNewBooking({ ...newBooking, checkInDate: e.target.value })} /></div>
                <div className="space-y-2"><Label>Check-out</Label><Input type="date" value={newBooking.checkOutDate} onChange={(e) => setNewBooking({ ...newBooking, checkOutDate: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Adults</Label><Input type="number" min={1} value={newBooking.adults} onChange={(e) => setNewBooking({ ...newBooking, adults: parseInt(e.target.value) || 1 })} /></div>
                <div className="space-y-2"><Label>Children</Label><Input type="number" min={0} value={newBooking.children} onChange={(e) => setNewBooking({ ...newBooking, children: parseInt(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Rate/Night</Label><Input type="number" value={newBooking.roomRate} onChange={(e) => setNewBooking({ ...newBooking, roomRate: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              {newBooking.checkInDate && newBooking.checkOutDate && newBooking.roomRate > 0 && (
                <div className="p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  {calculateNights(newBooking.checkInDate, newBooking.checkOutDate)} night(s) x {formatCurrency(newBooking.roomRate)} = <span className="font-medium text-foreground">{formatCurrency(newBooking.roomRate * calculateNights(newBooking.checkInDate, newBooking.checkOutDate))}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateBooking}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Bookings</p>
          <p className="text-2xl font-bold">{bookings.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Avg. Booking</p>
          <p className="text-2xl font-bold">{formatCurrency(avgBookingValue)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Status Breakdown</p>
          <div className="h-48">
            {statusChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ left: -10, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} width={25} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Bookings" radius={[4, 4, 0, 0]} barSize={28}>
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Booking Sources</p>
          <div className="h-48">
            {sourceChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {sourceChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={28}
                    iconType="circle"
                    iconSize={6}
                    formatter={(value: string) => <span className="text-[10px] text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Icon name="bx-search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
          <Input placeholder="Search bookings..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{bookings.length} bookings</span>
      </div>

      <div className="stat-card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Booking</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Guest</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Room</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Dates</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {[1,2,3,4,5].map((i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-20" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-28 mb-1" /><div className="shimmer h-3 w-20" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-16 mb-1" /><div className="shimmer h-3 w-20" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-20 mb-1" /><div className="shimmer h-3 w-20" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-16 mb-1" /><div className="shimmer h-3 w-12" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-7 w-7 rounded ml-auto" /></td>
                  </tr>
                ))}
              </>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No bookings found</td></tr>
            ) : bookings.map((b, i) => (
              <tr key={b.id} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                <td className="px-4 py-2.5 font-mono text-xs">{b.bookingNumber}</td>
                <td className="px-4 py-2.5">
                  <p className="font-medium truncate max-w-[140px]">{b.guest.firstName} {b.guest.lastName}</p>
                  <p className="text-xs text-muted-foreground">{b.guest.phone}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p>{b.room.roomNumber}</p>
                  <p className="text-xs text-muted-foreground">{b.room.roomType.name}</p>
                </td>
                <td className="px-4 py-2.5 text-xs">
                  <p>{formatDate(b.checkInDate)}</p>
                  <p className="text-muted-foreground">to {formatDate(b.checkOutDate)}</p>
                </td>
                <td className="px-4 py-2.5">
                  <p className="font-medium">{formatCurrency(Number(b.totalAmount))}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{b.source.replace('_', ' ')}</p>
                </td>
                <td className="px-4 py-2.5"><Badge className={getStatusColor(b.status)}>{b.status.replace('_', ' ')}</Badge></td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setDetailBooking(b)}><Icon name="bx-show" className="text-base" /></Button>
                    {b.status !== 'CANCELLED' && b.status !== 'CHECKED_OUT' && (
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive hover:text-destructive" onClick={() => handleCancel(b.id)}><Icon name="bx-x-circle" className="text-base" /></Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detailBooking && (
        <Dialog open={!!detailBooking} onOpenChange={() => setDetailBooking(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{detailBooking.bookingNumber}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Guest</p><p className="font-medium">{detailBooking.guest.firstName} {detailBooking.guest.lastName}</p></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{detailBooking.guest.phone}</p></div>
                <div><p className="text-xs text-muted-foreground">Room</p><p className="font-medium">{detailBooking.room.roomNumber} ({detailBooking.room.roomType.name})</p></div>
                <div><p className="text-xs text-muted-foreground">Guests</p><p className="font-medium">{detailBooking.adults}A + {detailBooking.children}C</p></div>
                <div><p className="text-xs text-muted-foreground">Check-in</p><p className="font-medium">{formatDate(detailBooking.checkInDate)}</p></div>
                <div><p className="text-xs text-muted-foreground">Check-out</p><p className="font-medium">{formatDate(detailBooking.checkOutDate)}</p></div>
                <div><p className="text-xs text-muted-foreground">Rate</p><p className="font-medium">{formatCurrency(Number(detailBooking.roomRate))}/night</p></div>
                <div><p className="text-xs text-muted-foreground">Total</p><p className="font-medium">{formatCurrency(Number(detailBooking.totalAmount))}</p></div>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(detailBooking.status)}>{detailBooking.status.replace('_', ' ')}</Badge>
                <Badge className={getStatusColor(detailBooking.paymentStatus)}>{detailBooking.paymentStatus}</Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
