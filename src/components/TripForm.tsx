"use client";

import { useState } from 'react';
import { Trip } from '@/lib/data';

interface TripFormProps {
  onSave: (trip: Trip) => void;
  onCancel: () => void;
}

export default function TripForm({ onSave, onCancel }: TripFormProps) {
  // Stan lokalny dla pól formularza
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Walidacja (prosta)
    if (!name || !destination || !startDate || !endDate) {
      alert("Wypełnij wszystkie pola!");
      return;
    }

    // Tworzenie nowego obiektu Trip (prosty generator ID)
    const newTrip: Trip = {
      id: Date.now(), // Unikalne ID na bazie czasu
      name,
      destination,
      startDate,
      endDate,
      participants: [], // Domyślnie dodajemy tylko autora
      status: 'planning',
    };

    onSave(newTrip); // Wywołanie funkcji przekazanej z page.tsx
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nazwa Wyjazdu</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Cel Podróży</label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>

      <div className="flex space-x-4">
        <div className="w-1/2">
          <label htmlFor="start" className="block text-sm font-medium text-gray-700">Data Startu</label>
          <input
            id="start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div className="w-1/2">
          <label htmlFor="end" className="block text-sm font-medium text-gray-700">Data Końca</label>
          <input
            id="end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-2">
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex-1"
        >
          Utwórz Wyjazd
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}