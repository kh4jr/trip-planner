"use client";

import { useState } from 'react';
import { Trip, Participant } from '@/lib/data';

interface TripFormProps {
  onSave: (trip: Trip) => void;
  onCancel: () => void;
}

export default function TripForm({ onSave, onCancel }: TripFormProps) {
  // 1. DEKLARACJA DATY (Naprawia błąd 'today')
  const today = new Date().toISOString().split('T')[0];

  // 2. DEKLARACJA STANÓW DLA PÓL TEKSTOWYCH I DAT
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 3. DEKLARACJA STANÓW DLA UCZESTNIKÓW (Naprawia błędy z obrazka image_6e91c1.png)
  const [participantName, setParticipantName] = useState(''); // Pole wpisywania
  const [participants, setParticipants] = useState<Participant[]>([]); // Lista osób

  // 4. DEKLARACJA FUNKCJI DODAWANIA (Naprawia błąd 'addParticipant')
  const addParticipant = () => {
  if (participantName.trim()) {
    const newP: Participant = {
      // 1. Unikalne ID jako string
      id: (Date.now() + Math.random()).toString(), 
      name: participantName.trim(),
      email: '', 
      
      // 2. Naprawa roli: Musi być dokładnie "member" lub "owner"
      role: 'member' 
    };
    
    setParticipants([...participants, newP]);
    setParticipantName('');
  }
};

  // Usuwanie uczestnika
  const removeParticipant = (id: string | number) => {
  setParticipants(participants.filter(p => p.id !== id));
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !destination || !startDate || !endDate) {
      alert("Wypełnij wszystkie pola!");
      return;
    }

    const newTrip: Trip = {
      id: Date.now(),
      name,
      destination,
      startDate,
      endDate,
      participants: participants, // Przekazuje listę do zapisu
      status: 'planning',
    };
    onSave(newTrip);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* SEKCJA NAZWY I CELU */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nazwa Wyjazdu</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded text-gray-900" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Cel Podróży</label>
        <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full p-2 border rounded text-gray-900" required />
      </div>

      {/* SEKCJA UCZESTNIKÓW (To co miałeś na obrazku image_6e91c1.png) */}
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
        <label className="block text-sm font-bold text-blue-800 mb-2">Uczestnicy Wyjazdu</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Imię uczestnika"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            className="flex-1 p-2 border border-blue-200 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addParticipant();
              }
            }}
          />
          <button type="button" onClick={addParticipant} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Dodaj
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <span key={p.id} className="bg-white border border-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-2 text-gray-700">
              {p.name}
              <button type="button" onClick={() => removeParticipant(p.id)} className="text-red-400 font-bold hover:text-red-600">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* SEKCJA DAT (Z blokadą przeszłości) */}
      <div className="flex space-x-4">
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700">Data Startu</label>
          <input type="date" min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded text-gray-900" required />
        </div>
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700">Data Końca</label>
          <input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded text-gray-900" required />
        </div>
      </div>

      <div className="flex space-x-3 pt-4 border-t">
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex-1 shadow-md">Utwórz Wyjazd</button>
        <button type="button" onClick={onCancel} className="bg-gray-100 text-gray-600 font-semibold py-2 px-4 rounded-lg">Anuluj</button>
      </div>
    </form>
  );
}