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
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Payment {
  id: string; amount: string; paymentMethod: string; paymentType: string; createdAt: string; reference: string; notes: string;
  booking: { bookingNumber: string; guest: { firstName: string; lastName: string }; room: { roomNumber: string } };
}
interface Booking { id: string; bookingNumber: string; totalAmount: string; paidAmount: string; guest: { firstName: string; lastName: string }; room: { roomNumber: string } }

const CHART_PALETTE = ['#0f172a', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

function ChartTooltip({ active, payload, label }: any) {
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterMethod, setFilterMethod] = useState('all');
  const [newPayment, setNewPayment] = useState({ bookingId: '', amount: 0, paymentMethod: 'CASH', reference: '', notes: '' });
  const [bookingSearch, setBookingSearch] = useState('');

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterMethod !== 'all') params.set('method', filterMethod);
      const data = await api.get<{ payments: Payment[] }>(`/payments?${params}`);
      setPayments(data.payments);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [filterMethod]);

  useEffect(() => {
    fetchPayments();
    api.get<{ bookings: Booking[] }>('/bookings?status=CHECKED_IN&limit=50').then((d) => setBookings(d.bookings || [])).catch(console.error);
  }, [fetchPayments]);

  const handleCreate = async () => {
    try {
      await api.post(`/payments/${newPayment.bookingId}`, { ...newPayment, amount: Number(newPayment.amount) });
      setAddDialogOpen(false); setNewPayment({ bookingId: '', amount: 0, paymentMethod: 'CASH', reference: '', notes: '' }); fetchPayments();
    } catch (err: any) { alert(err.message); }
  };

  const filteredBookings = bookings.filter((b) =>
    b.bookingNumber.toLowerCase().includes(bookingSearch.toLowerCase()) ||
    `${b.guest.firstName} ${b.guest.lastName}`.toLowerCase().includes(bookingSearch.toLowerCase())
  );

  const selectedBooking = bookings.find((b) => b.id === newPayment.bookingId);

  const methodCounts = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
    return acc;
  }, {});
  const methodRevenue = payments.reduce<Record<string, number>>((acc, p) => {
    if (p.paymentType !== 'REFUND') {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + Number(p.amount);
    }
    return acc;
  }, {});

  const methodCountData = Object.entries(methodCounts).map(([name, count]) => ({ name: name.replace('_', ' '), value: count }));
  const methodRevenueData = Object.entries(methodRevenue).map(([name, amount]) => ({ name: name.replace('_', ' '), amount }));

  const totalCollected = payments.filter((p) => p.paymentType !== 'REFUND').reduce((sum, p) => sum + Number(p.amount), 0);
  const completedCount = payments.filter((p) => p.paymentType !== 'REFUND').length;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Financial transactions</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Icon name="bx-plus" className="text-lg mr-1" />Record Payment</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Payment</DialogTitle><DialogDescription>Enter payment details</DialogDescription></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Booking</Label>
                <div className="relative">
                  <Icon name="bx-search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
                  <Input placeholder="Search by booking number or guest name..." className="pl-8 h-9 text-sm" value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} />
                </div>
                <Select value={newPayment.bookingId} onValueChange={(v) => { const b = bookings.find((b) => b.id === v); setNewPayment({ ...newPayment, bookingId: v, amount: b ? Number(b.totalAmount) - Number(b.paidAmount) : 0 }); }}>
                  <SelectTrigger><SelectValue placeholder="Select booking" /></SelectTrigger>
                  <SelectContent>
                    {filteredBookings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.bookingNumber} — {b.guest.firstName} {b.guest.lastName} (Due: {formatCurrency(Number(b.totalAmount) - Number(b.paidAmount))})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedBooking && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted/30"><p className="text-muted-foreground">Total</p><p className="font-medium">{formatCurrency(Number(selectedBooking.totalAmount))}</p></div>
                  <div className="p-2 rounded bg-muted/30"><p className="text-muted-foreground">Paid</p><p className="font-medium">{formatCurrency(Number(selectedBooking.paidAmount))}</p></div>
                  <div className="p-2 rounded bg-destructive/5"><p className="text-muted-foreground">Due</p><p className="font-medium text-destructive">{formatCurrency(Number(selectedBooking.totalAmount) - Number(selectedBooking.paidAmount))}</p></div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Amount</Label><Input type="number" value={newPayment.amount || ''} onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Method</Label>
                  <Select value={newPayment.paymentMethod} onValueChange={(v) => setNewPayment({ ...newPayment, paymentMethod: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER'].map((m) => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Transaction Reference</Label><Input value={newPayment.reference} onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })} placeholder="Optional" /></div>
              <div className="space-y-2"><Label>Notes</Label><Input value={newPayment.notes} onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })} placeholder="Optional" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate}>Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Collected</p>
          <p className="text-2xl font-bold">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Transactions</p>
          <p className="text-2xl font-bold">{payments.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Completed</p>
          <p className="text-2xl font-bold">{completedCount}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Payments by Method</p>
          <div className="h-48">
            {methodCountData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodCountData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={4} dataKey="value" strokeWidth={0}>
                    {methodCountData.map((_, i) => (
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
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Revenue by Method</p>
          <div className="h-48">
            {methodRevenueData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={methodRevenueData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]} barSize={28}>
                    {methodRevenueData.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <Select value={filterMethod} onValueChange={setFilterMethod}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER'].map((m) => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{payments.length} payments</span>
      </div>

      <div className="stat-card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Booking</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Guest</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Method</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {[1,2,3,4,5].map((i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-20" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-28" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-16" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-20" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-24" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-5 w-16 rounded-full" /></td>
                  </tr>
                ))}
              </>
            ) : payments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No payments found</td></tr>
            ) : payments.map((p, i) => (
              <tr key={p.id} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                <td className="px-4 py-2.5 font-mono text-xs">{p.booking.bookingNumber}</td>
                <td className="px-4 py-2.5 truncate max-w-[140px]">{p.booking.guest.firstName} {p.booking.guest.lastName}</td>
                <td className="px-4 py-2.5 font-medium">{formatCurrency(Number(p.amount))}</td>
                <td className="px-4 py-2.5 text-xs uppercase">{p.paymentMethod.replace('_', ' ')}</td>
                <td className="px-4 py-2.5 text-xs">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-2.5"><Badge className={getStatusColor(p.paymentType)}>{p.paymentType.replace('_', ' ')}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
