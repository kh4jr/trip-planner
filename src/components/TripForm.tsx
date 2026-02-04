"use client";
import { useState } from 'react';
import { Trip, Participant } from '@/lib/data';

interface TripFormProps {
  onSave: (trip: Trip & { participants: Participant[] }) => void;
  onCancel: () => void;
}

export default function TripForm({ onSave, onCancel }: TripFormProps) {
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [participants, setParticipants] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTrip: Trip & { participants: Participant[] } = {
      id: Date.now(), 
      name,
      destination,
      startDate,
      endDate,
      participants: participants.split(',').map((p, index) => ({
        id: Date.now() + index,
        name: p.trim(),
        email: '',
        role: 'użytkownik',
        tripId: 0
      }))
    };

    onSave(newTrip);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <input className="w-full p-2 border rounded" placeholder="Nazwa wyjazdu" value={name} onChange={e => setName(e.target.value)} required />
      <input className="w-full p-2 border rounded" placeholder="Cel podróży" value={destination} onChange={e => setDestination(e.target.value)} required />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" className="p-2 border rounded" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        <input type="date" className="p-2 border rounded" value={endDate} onChange={e => setEndDate(e.target.value)} required />
      </div>
      <textarea className="w-full p-2 border rounded" placeholder="Uczestnicy (po przecinku)" value={participants} onChange={e => setParticipants(e.target.value)} />
      <div className="flex gap-2">
        <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded font-bold">Zapisz</button>
        <button type="button" onClick={onCancel} className="flex-1 bg-gray-300 p-2 rounded">Anuluj</button>
      </div>
    </form>
  );
}