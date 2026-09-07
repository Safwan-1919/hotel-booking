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
import { formatCurrency, getStatusColor } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Room {
  id: string;
  roomNumber: string;
  floor: string;
  status: string;
  roomType: { id: string; name: string; basePrice: string; bedType: string; maxGuests: number };
}

interface RoomType {
  id: string;
  name: string;
  basePrice: string;
  bedType: string;
  maxGuests: number;
}

const floorOptions = ['GROUND', 'FIRST', 'SECOND', 'THIRD', 'FOURTH'];
const statusOptions = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'CLEANING', 'OUT_OF_ORDER'];

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#0f172a',
  OCCUPIED: '#334155',
  RESERVED: '#64748b',
  MAINTENANCE: '#94a3b8',
  CLEANING: '#cbd5e1',
  OUT_OF_ORDER: '#e2e8f0',
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-2.5 shadow-sm">
      <p className="text-xs font-medium">{payload[0].name}: {payload[0].value}</p>
    </div>
  );
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [statusDialogRoom, setStatusDialogRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({ roomNumber: '', floor: 'GROUND', roomTypeId: '' });

  const fetchRooms = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterFloor !== 'all') params.set('floor', filterFloor);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const data = await api.get<{ rooms: Room[] }>(`/rooms?${params}`);
      setRooms(data.rooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterFloor, filterStatus]);

  useEffect(() => {
    fetchRooms();
    api.get<RoomType[]>('/rooms/types').then(setRoomTypes).catch(console.error);
  }, [fetchRooms]);

  const handleAddRoom = async () => {
    try {
      await api.post('/rooms', newRoom);
      setAddDialogOpen(false);
      setNewRoom({ roomNumber: '', floor: 'GROUND', roomTypeId: '' });
      fetchRooms();
    } catch (err: any) { alert(err.message); }
  };

  const handleStatusChange = async (status: string) => {
    if (!statusDialogRoom) return;
    try {
      await api.patch(`/rooms/${statusDialogRoom.id}/status`, { status });
      setStatusDialogRoom(null);
      fetchRooms();
    } catch (err: any) { alert(err.message); }
  };

  const statusCounts = rooms.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(statusCounts)
    .map(([status, count]) => ({ name: status.replace('_', ' '), value: count }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Rooms</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage room inventory and status</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Icon name="bx-plus" className="text-lg mr-1" />Add Room</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>Add a room to the inventory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Room Number</Label>
                <Input placeholder="e.g. G01, 102" value={newRoom.roomNumber} onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Floor</Label>
                <Select value={newRoom.floor} onValueChange={(v) => setNewRoom({ ...newRoom, floor: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {floorOptions.map((f) => <SelectItem key={f} value={f}>{f.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Select value={newRoom.roomTypeId} onValueChange={(v) => setNewRoom({ ...newRoom, roomTypeId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} — {formatCurrency(Number(t.basePrice))}/night</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddRoom}>Add Room</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {rooms.length > 0 && (
        <div className="stat-card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Status Distribution</p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name.replace(' ', '_')] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {chartData.map((d) => {
                const key = d.name.replace(' ', '_');
                return (
                  <div key={d.name} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[key] || '#94a3b8' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{d.name}</p>
                      <p className="text-lg font-bold">{d.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="filter-bar">
        <Select value={filterFloor} onValueChange={setFilterFloor}>
          <SelectTrigger className="w-full sm:w-36 h-9"><SelectValue placeholder="Floor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Floors</SelectItem>
            {floorOptions.map((f) => <SelectItem key={f} value={f}>{f.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{rooms.length} rooms</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[1,2,3,4,5,6,7,8].map((i) => (
            <div key={i} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="shimmer h-6 w-12" />
                <div className="shimmer h-5 w-16 rounded-full" />
              </div>
              <div className="shimmer h-4 w-20 mb-1" />
              <div className="shimmer h-3 w-28 mb-2" />
              <div className="shimmer h-4 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="stat-card cursor-pointer hover:border-primary/20 transition-all duration-150"
              onClick={() => setStatusDialogRoom(room)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">{room.roomNumber}</span>
                <Badge className={getStatusColor(room.status)}>{room.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{room.roomType.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{room.floor.replace('_', ' ')} floor · {room.roomType.bedType}</p>
              <p className="text-sm font-semibold text-primary mt-2">{formatCurrency(Number(room.roomType.basePrice))}<span className="text-xs font-normal text-muted-foreground">/night</span></p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!statusDialogRoom} onOpenChange={() => setStatusDialogRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Room {statusDialogRoom?.roomNumber}</DialogTitle>
            <DialogDescription>Update room status</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-2">
            {statusOptions.map((status) => (
              <Button
                key={status}
                variant={statusDialogRoom?.status === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange(status)}
                className="justify-start text-xs"
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
