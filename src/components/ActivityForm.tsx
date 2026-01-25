"use client";
import { useState } from 'react';
import { Activity } from '@/lib/data';

interface ActivityFormProps {
  tripId: number;
  participants: string[];
  onSave: (activity: Activity) => void;
  onCancel: () => void;
}

export default function ActivityForm({ tripId, onSave, onCancel }: ActivityFormProps) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Tworzymy obiekt dokładnie według typu Activity z lib/data.ts
    const newActivity: Activity = {
      id: Date.now(), // Generujemy tymczasowe ID jako number
      tripId: tripId,
      name: name,
      category: 'Plan',
      time: time,
      location: location,
      price: parseFloat(price) || 0,
      participants: []
    };

    onSave(newActivity);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-6 rounded-xl bg-white shadow-sm">
      <h3 className="text-xl font-bold text-blue-800">Nowa Aktywność</h3>
      
      <input 
        className="w-full p-2 border rounded text-black" 
        placeholder="Co będziemy robić?" 
        value={name} 
        onChange={e => setName(e.target.value)} 
        required 
      />
      
      <div className="grid grid-cols-2 gap-4">
        <input 
          type="time" 
          className="p-2 border rounded text-black" 
          value={time} 
          onChange={e => setTime(e.target.value)} 
          required 
        />
        <input 
          className="w-full p-2 border rounded text-black" 
          placeholder="Lokalizacja" 
          value={location} 
          onChange={e => setLocation(e.target.value)} 
        />
      </div>
      
      <input 
        type="number" 
        className="w-full p-2 border rounded text-black" 
        placeholder="Koszt" 
        value={price} 
        onChange={e => setPrice(e.target.value)} 
      />
      
      <div className="flex gap-2">
        <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition">
          Dodaj do planu
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 text-black py-2 rounded hover:bg-gray-300 transition">
          Anuluj
        </button>
      </div>
    </form>
  );
}