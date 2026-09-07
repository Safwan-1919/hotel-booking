'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

interface Guest {
  id: string; firstName: string; lastName: string; email: string; phone: string;
  idType: string; idNumber: string; nationality: string; status: string;
  totalStays: number; totalSpent: string;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newGuest, setNewGuest] = useState({ firstName: '', lastName: '', email: '', phone: '', idType: 'passport', idNumber: '', nationality: '' });

  const fetchGuests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const data = await api.get<{ guests: Guest[] }>(`/guests?${params}`);
      setGuests(data.guests);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  const handleCreate = async () => {
    try {
      await api.post('/guests', newGuest);
      setAddDialogOpen(false);
      setNewGuest({ firstName: '', lastName: '', email: '', phone: '', idType: 'passport', idNumber: '', nationality: '' });
      fetchGuests();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Guests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Guest profiles and history</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Icon name="bx-plus" className="text-lg mr-1" />Add Guest</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Guest</DialogTitle><DialogDescription>Enter guest details</DialogDescription></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>First Name</Label><Input value={newGuest.firstName} onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input value={newGuest.lastName} onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={newGuest.email} onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>ID Type</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={newGuest.idType} onChange={(e) => setNewGuest({ ...newGuest, idType: e.target.value })}>
                    <option value="passport">Passport</option><option value="national_id">National ID</option><option value="drivers_license">Driver&apos;s License</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>ID Number</Label><Input value={newGuest.idNumber} onChange={(e) => setNewGuest({ ...newGuest, idNumber: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Nationality</Label><Input value={newGuest.nationality} onChange={(e) => setNewGuest({ ...newGuest, nationality: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate}>Add Guest</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="filter-bar">
        <div className="relative flex-1 max-w-xs">
          <Icon name="bx-search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-base" />
          <Input placeholder="Search guests..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <span className="text-xs text-muted-foreground">{guests.length} guests</span>
      </div>

      <div className="stat-card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Guest</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Contact</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">ID</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Stays</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Spent</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {[1,2,3,4,5].map((i) => (
                  <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><div className="shimmer h-7 w-7 rounded-full" /><div><div className="shimmer h-4 w-24 mb-1" /><div className="shimmer h-3 w-16" /></div></div></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-28 mb-1" /><div className="shimmer h-3 w-20" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-20 mb-1" /><div className="shimmer h-3 w-24" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-8" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-4 w-16" /></td>
                    <td className="px-4 py-2.5"><div className="shimmer h-5 w-14 rounded-full" /></td>
                  </tr>
                ))}
              </>
            ) : guests.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No guests found</td></tr>
            ) : guests.map((g, i) => (
              <tr key={g.id} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-primary/5 flex items-center justify-center text-[11px] font-medium text-primary">{g.firstName[0]}{g.lastName[0]}</div>
                    <div className="min-w-0">
                      <p className="font-medium truncate max-w-[120px]">{g.firstName} {g.lastName}</p>
                      <p className="text-xs text-muted-foreground">{g.nationality || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs">
                  <p className="truncate max-w-[120px]">{g.email || '—'}</p>
                  <p className="text-muted-foreground">{g.phone}</p>
                </td>
                <td className="px-4 py-2.5 text-xs">
                  <p className="capitalize">{g.idType.replace('_', ' ')}</p>
                  <p className="text-muted-foreground">{g.idNumber}</p>
                </td>
                <td className="px-4 py-2.5 text-sm font-medium">{g.totalStays}</td>
                <td className="px-4 py-2.5 text-sm font-medium">{formatCurrency(Number(g.totalSpent))}</td>
                <td className="px-4 py-2.5"><Badge variant={g.status === 'ACTIVE' ? 'default' : 'destructive'}>{g.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
