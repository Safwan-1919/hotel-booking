'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Service {
  id: string; name: string; description: string; price: string; category: string;
  isActive: boolean; bookingServices: Array<{ id: string }>;
}

const categoryIcons: Record<string, string> = {
  FOOD: 'bx-food-menu', BEVERAGE: 'bx-drink', MINIBAR: 'bx-package',
  LAUNDRY: 'bx-dry-clean', TRANSPORT: 'bx-car', SPA: 'bx-spa',
  OTHER: 'bx-category-alt',
};
const categoryColors: Record<string, string> = {
  FOOD: 'text-primary', BEVERAGE: 'text-primary/70', MINIBAR: 'text-muted-foreground',
  LAUNDRY: 'text-primary/60', TRANSPORT: 'text-primary/80', SPA: 'text-primary/90',
  OTHER: 'text-muted-foreground',
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', price: 0, category: 'FOOD' });

  useEffect(() => {
    api.get<Service[]>('/services').then(setServices).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    try {
      await api.post('/services', { ...newService, price: Number(newService.price) });
      setAddDialogOpen(false); setNewService({ name: '', description: '', price: 0, category: 'FOOD' });
      api.get<Service[]>('/services').then(setServices).catch(console.error);
    } catch (err: any) { alert(err.message); }
  };

  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc; }, {});

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Hotel services &amp; amenities</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild><Button size="sm"><Icon name="bx-plus" className="text-lg mr-1" />Add Service</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Service</DialogTitle><DialogDescription>Add a hotel service</DialogDescription></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Name</Label><Input value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Price</Label><Input type="number" value={newService.price || ''} onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })} /></div>
                <div className="space-y-2"><Label>Category</Label>
                  <Select value={newService.category} onValueChange={(v) => setNewService({ ...newService, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['FOOD', 'BEVERAGE', 'MINIBAR', 'LAUNDRY', 'TRANSPORT', 'SPA', 'OTHER'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-5">
          {['FOOD', 'SPA', 'TRANSPORT'].map((cat) => (
            <div key={cat}>
              <div className="shimmer h-3 w-16 mb-3" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="stat-card">
                    <div className="flex items-start gap-3">
                      <div className="shimmer h-9 w-9 rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="shimmer h-4 w-24" />
                          <div className="shimmer h-4 w-14" />
                        </div>
                        <div className="shimmer h-3 w-full mb-1.5" />
                        <div className="shimmer h-3 w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <div key={s.id} className="stat-card">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon name={(categoryIcons[s.category] || 'bx-diamond') as any} className={`text-lg ${categoryColors[s.category] || 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{s.name}</p>
                          <p className="text-sm font-bold text-primary whitespace-nowrap">{formatCurrency(Number(s.price))}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1.5">{s.bookingServices.length} order(s)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
