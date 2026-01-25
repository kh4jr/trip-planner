'use client';

import { useState } from "react";
import { Activity, Expense, TripItem, Note, Participant, Trip } from '@/lib/data';

export type FullTrip = Trip & { participants: Participant[] };

interface TripTabsProps {
  trip: FullTrip;
  onDeleteTrip: (id: number) => Promise<void>;
  activities: Activity[];
  expenses: Expense[];
  tripItems: TripItem[];
  notes: Note[];
  onAddActivity: (activity: Activity) => void; 
  onAddExpense: (expense: Expense) => void;
  onAddItem: (item: TripItem) => void;
  onAddNote: (note: Note) => void;
  onDeleteActivity: (id: number) => Promise<void>;
  onToggleItem: (id: number) => void;
}

const TABS = [
  { id: 'plan', label: 'Plan Podróży' },
  { id: 'budget', label: 'Budżet 💸' },
  { id: 'tasks', label: 'Zadania/Pakowanie' },
  { id: 'photos', label: 'Zdjęcia 📸' },
  { id: 'notes', label: 'Notatki 📝' },
];

export default function TripTabs(props: TripTabsProps) {
  const [activeTab, setActiveTab] = useState('plan');
  
  // Stan dla formularza nowej aktywności
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityTime, setNewActivityTime] = useState("");
  const [loading, setLoading] = useState(false);

  // Funkcja zapisu do bazy
  const handleSaveActivity = async () => {
    if (!newActivityName || !newActivityTime) return;
    setLoading(true);

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newActivityName,
          time: newActivityTime,
          tripId: props.trip.id // Łączymy z id wyjazdu
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        props.onAddActivity(saved); 
        setIsAddingActivity(false);
        setNewActivityName("");
        setNewActivityTime("");
      }
    } catch (error) {
      console.error("Błąd podczas dodawania aktywności:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{props.trip.name}</h2>
          <p className="text-lg text-blue-600 mb-2">{props.trip.destination}</p>
        </div>
        <button
          onClick={() => props.onDeleteTrip(props.trip.id)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
        >
          Usuń Wyjazd
        </button>
      </div>

      <div className="flex space-x-2 border-b overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 text-gray-900">
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-700">Twój Plan</h3>
              <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                Aktywności: {props.activities.length}
              </span>
            </div>

            {/* Formularz dodawania */}
            {isAddingActivity ? (
              <div className="bg-blue-50/50 p-5 rounded-2xl border-2 border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Co planujesz?</label>
                    <input 
                      autoFocus
                      placeholder="np. Zwiedzanie koloseum" 
                      className="w-full p-3 border-2 border-white rounded-xl outline-none focus:border-blue-500 shadow-sm"
                      value={newActivityName}
                      onChange={(e) => setNewActivityName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Kiedy?</label>
                    <input 
                      type="datetime-local" 
                      className="w-full p-3 border-2 border-white rounded-xl outline-none focus:border-blue-500 shadow-sm"
                      value={newActivityTime}
                      onChange={(e) => setNewActivityTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    disabled={loading}
                    onClick={handleSaveActivity} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {loading ? "Zapisywanie..." : "Zapisz w planie"}
                  </button>
                  <button 
                    onClick={() => setIsAddingActivity(false)} 
                    className="px-6 py-3 bg-white text-gray-500 font-semibold rounded-xl hover:bg-gray-100 transition-all"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAddingActivity(true)}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all font-medium flex items-center justify-center gap-2"
              >
                <span className="text-xl">+</span> Dodaj nową aktywność
              </button>
            )}

            {/* Lista aktywności */}
            <div className="space-y-3">
              {props.activities.length === 0 ? (
                <p className="text-center text-gray-400 py-10 italic">Twój plan jest jeszcze pusty...</p>
              ) : (
                props.activities.sort((a,b) => new Date(a.time).getTime() - new Date(b.time).getTime()).map((act) => (
                  <div key={act.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-lg font-bold text-xs text-center min-w-[70px]">
                      {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{act.name}</h4>
                      <p className="text-xs text-gray-500">{new Date(act.time).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => props.onDeleteActivity(act.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Miejsce na inne zakładki (Budget, Tasks itd.) */}
        {activeTab === 'budget' && <div className="p-10 text-center text-gray-400">Moduł budżetu wkrótce...</div>}
      </div>
    </div>
  );
}