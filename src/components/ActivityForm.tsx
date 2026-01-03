// src/components/ActivityForm.tsx
"use client";

import { useState } from 'react';
import { Activity } from '@/lib/data';

interface ActivityFormProps {
  tripId: number;
  participants: string[]; // Lista uczestników do wyboru
  onSave: (activity: Activity) => void;
  onCancel: () => void;
}

export default function ActivityForm({ tripId, participants, onSave, onCancel }: ActivityFormProps) {
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('Wszyscy');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!time || !description) {
      alert("Wypełnij czas i opis!");
      return;
    }

    const newActivity: Activity = {
      id: Date.now() * Math.random(), // Używamy losowego ID
      tripId: tripId,
      time,
      description,
      assignedTo,
    };

    onSave(newActivity); // Dodaj nową aktywność do globalnego stanu
  };

  return (
    <div className="p-4 border-2 border-dashed border-blue-200 rounded-xl">
        <h3 className="text-xl font-semibold mb-4">Dodawanie Nowej Aktywności</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700">Czas / Dzień</label>
                <input
                    id="time"
                    type="text"
                    placeholder="np. 10:00, Dzień 2"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Opis Aktywności</label>
                <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="np. Rezerwacja biletów na Muzeum Narodowe"
                    required
                />
            </div>

            <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Osoba Odpowiedzialna</label>
                <select
                    id="assignedTo"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                >
                    <option value="Wszyscy">Wszyscy</option>
                    {participants.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>
            </div>

            <div className="flex space-x-3 pt-2">
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex-1"
                >
                    Zapisz Aktywność
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
    </div>
  );
}