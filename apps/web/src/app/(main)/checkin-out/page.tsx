'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

interface Booking {
  id: string; bookingNumber: string; status: string; paymentStatus: string;
  checkInDate: string; checkOutDate: string; adults: number; children: number;
  totalAmount: string; paidAmount: string;
  guest: { firstName: string; lastName: string; phone: string };
  room: { roomNumber: string; roomType: { name: string } };
}

export default function CheckInOutPage() {
  const [pendingCheckIn, setPendingCheckIn] = useState<Booking[]>([]);
  const [activeGuests, setActiveGuests] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInDialog, setCheckInDialog] = useState<Booking | null>(null);
  const [checkOutDialog, setCheckOutDialog] = useState<Booking | null>(null);

  const fetchData = async () => {
    try {
      const [checkIns, checkedIn] = await Promise.all([
        api.get<{ bookings: Booking[] }>('/bookings?status=CONFIRMED&limit=50'),
        api.get<{ bookings: Booking[] }>('/bookings?status=CHECKED_IN&limit=50'),
      ]);
      setPendingCheckIn(checkIns.bookings);
      setActiveGuests(checkedIn.bookings);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCheckIn = async () => {
    if (!checkInDialog) return;
    try { await api.post(`/bookings/${checkInDialog.id}/check-in`, {}); setCheckInDialog(null); fetchData(); } catch (err: any) { alert(err.message); }
  };

  const handleCheckOut = async () => {
    if (!checkOutDialog) return;
    try { await api.post(`/bookings/${checkOutDialog.id}/check-out`, {}); setCheckOutDialog(null); fetchData(); } catch (err: any) { alert(err.message); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><div className="shimmer h-7 w-40 mb-1.5" /><div className="shimmer h-4 w-52" /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1,2,3].map((i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center gap-3">
                <div className="shimmer h-9 w-9 rounded-lg" />
                <div><div className="shimmer h-6 w-10 mb-1" /><div className="shimmer h-3 w-24" /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="shimmer h-8 w-8 rounded-full" />
                <div><div className="shimmer h-4 w-28 mb-1" /><div className="shimmer h-3 w-16" /></div>
              </div>
              <div className="shimmer h-px w-full mb-2" />
              <div className="flex justify-between"><div className="shimmer h-4 w-20" /><div className="shimmer h-8 w-16 rounded" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Check-in / Check-out</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Guest arrivals and departures</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Pending Check-ins', value: pendingCheckIn.length, icon: 'bx-right-arrow-alt' as const },
          { label: 'Active Guests', value: activeGuests.length, icon: 'bx-time-five' as const },
          { label: 'Due Check-outs', value: 0, icon: 'bx-down-arrow' as const },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center">
                <Icon name={s.icon} className="text-lg text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="checkin">
        <TabsList className="h-9">
          <TabsTrigger value="checkin" className="text-xs">Pending ({pendingCheckIn.length})</TabsTrigger>
          <TabsTrigger value="active" className="text-xs">Active ({activeGuests.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="checkin" className="mt-3">
          {pendingCheckIn.length === 0 ? (
            <div className="stat-card text-center py-8 text-sm text-muted-foreground">No pending check-ins</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pendingCheckIn.map((b) => (
                <div key={b.id} className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-xs font-medium text-primary">{b.guest.firstName[0]}{b.guest.lastName[0]}</div>
                      <div>
                        <p className="text-sm font-medium">{b.guest.firstName} {b.guest.lastName}</p>
                        <p className="text-xs text-muted-foreground">{b.guest.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div><p className="text-muted-foreground">Room</p><p className="font-medium">{b.room.roomNumber} · {b.room.roomType.name}</p></div>
                    <div><p className="text-muted-foreground">Guests</p><p className="font-medium">{b.adults}A + {b.children}C</p></div>
                    <div><p className="text-muted-foreground">Check-in</p><p className="font-medium">{formatDate(b.checkInDate)}</p></div>
                    <div><p className="text-muted-foreground">Check-out</p><p className="font-medium">{formatDate(b.checkOutDate)}</p></div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <p className="text-sm font-semibold">{formatCurrency(Number(b.totalAmount))}</p>
                    <Button size="sm" className="h-9 text-xs" onClick={() => setCheckInDialog(b)}>Check In</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="active" className="mt-3">
          {activeGuests.length === 0 ? (
            <div className="stat-card text-center py-8 text-sm text-muted-foreground">No active guests</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {activeGuests.map((b) => (
                <div key={b.id} className="stat-card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-xs font-medium text-primary">{b.guest.firstName[0]}{b.guest.lastName[0]}</div>
                    <div>
                      <p className="text-sm font-medium">{b.guest.firstName} {b.guest.lastName}</p>
                      <p className="text-xs text-muted-foreground">Room {b.room.roomNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-sm font-semibold text-destructive">{formatCurrency(Number(b.totalAmount) - Number(b.paidAmount))}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => setCheckOutDialog(b)}>Check Out</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!checkInDialog} onOpenChange={() => setCheckInDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Confirm Check-in</DialogTitle></DialogHeader>
          {checkInDialog && (
            <div className="space-y-2 text-sm py-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span className="font-medium">{checkInDialog.guest.firstName} {checkInDialog.guest.lastName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span className="font-medium">{checkInDialog.room.roomNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{formatDate(checkInDialog.checkInDate)} – {formatDate(checkInDialog.checkOutDate)}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCheckInDialog(null)}>Cancel</Button>
            <Button size="sm" onClick={handleCheckIn}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!checkOutDialog} onOpenChange={() => setCheckOutDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Confirm Check-out</DialogTitle></DialogHeader>
          {checkOutDialog && (
            <div className="space-y-2 text-sm py-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span className="font-medium">{checkOutDialog.guest.firstName} {checkOutDialog.guest.lastName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span className="font-medium">{checkOutDialog.room.roomNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{formatCurrency(Number(checkOutDialog.totalAmount))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium">{formatCurrency(Number(checkOutDialog.paidAmount))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Balance</span><span className="font-medium text-destructive">{formatCurrency(Number(checkOutDialog.totalAmount) - Number(checkOutDialog.paidAmount))}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCheckOutDialog(null)}>Cancel</Button>
            <Button size="sm" onClick={handleCheckOut}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
