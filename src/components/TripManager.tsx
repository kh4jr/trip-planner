"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react"; // Dodane dla obsługi sesji
import TripList from '@/components/TripList'; 
import TripTabs, { FullTrip } from "@/components/TripTabs"; 
import TripForm from "@/components/TripForm";
import AuthModal from "@/components/AuthModal";
import { Activity, Expense, TripItem, Note } from '@/lib/data';

export default function TripManager({ initialTrips }: { initialTrips: FullTrip[] }) {
  const { data: session } = useSession(); // Pobieramy dane zalogowanego użytkownika
  const [trips, setTrips] = useState<FullTrip[]>(initialTrips);
  const [selectedTrip, setSelectedTrip] = useState<FullTrip | null>(trips[0] || null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tripItems, setTripItems] = useState<TripItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState(false); 
  const [isLoggingIn, setIsLoggingIn] = useState(false); 

  const handleAddActivity = (activity: Activity) => {
    setActivities(prev => [...prev, activity]);
  };

  const handleDeleteTrip = async (id: number) => {
    setTrips(prev => prev.filter(t => t.id !== id));
    if (selectedTrip?.id === id) setSelectedTrip(trips.find(t => t.id !== id) || null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 p-4 mb-8 rounded-2xl shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          TripPlanner
        </h1>
        <div className="flex items-center space-x-4">
          {session ? (
            // Widok dla zalogowanego
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 leading-none">{session.user?.name}</p>
                <button 
                  onClick={() => signOut()}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold"
                >
                  Wyloguj się
                </button>
              </div>
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                {session.user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            // Widok dla niezalogowanego
            <button 
              onClick={() => setIsLoggingIn(true)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              Zaloguj się
            </button>
          )}
        </div>
      </header>

      {/* MODAL AUTENTYKACJI */}
      <AuthModal 
        isOpen={isLoggingIn} 
        onClose={() => setIsLoggingIn(false)} 
      />

      {/* MODAL TWORZENIA WYJAZDU */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <TripForm 
              onSave={async (tempTrip) => {
                const res = await fetch("/api/trips", {
                  method: "POST",
                  body: JSON.stringify(tempTrip),
                });
                const savedTrip = await res.json();
                setTrips([savedTrip, ...trips]);
                setIsCreating(false);
              }} 
              onCancel={() => setIsCreating(false)} 
            />
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-80">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Twoje Wyjazdy</h2>
            <TripList 
              trips={trips} 
              activeTripId={selectedTrip?.id || null} 
              onSelectTrip={(id) => setSelectedTrip(trips.find(t => t.id === id) || null)} 
            />
            <button 
              onClick={() => session ? setIsCreating(true) : setIsLoggingIn(true)}
              className={`w-full mt-4 py-3 font-bold rounded-xl shadow-md transition-all ${
                session ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300"
              }`}
            >
              {session ? "+ Nowy Wyjazd" : "Zaloguj się, by dodać"}
            </button>
          </div>
        </aside>

        <main className="flex-1">
          {selectedTrip ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <TripTabs 
                trip={selectedTrip} 
                onDeleteTrip={handleDeleteTrip}
                activities={activities}
                expenses={expenses}
                tripItems={tripItems}
                notes={notes}
                onAddActivity={(activity) => handleAddActivity(activity)} 
                onAddExpense={(expense) => setExpenses([...expenses, expense])} 
                onAddItem={(item) => setTripItems([...tripItems, item])}
                onAddNote={(note) => setNotes([...notes, note])}
                onDeleteActivity={async (id) => { /* logika */ }}
                onToggleItem={(id) => { /* logika */ }}
              />
            </div>
          ) : (
            <div className="text-center p-20 border-2 border-dashed rounded-2xl text-gray-400 bg-white/50">
              Wybierz wyjazd z listy po lewej stronie
            </div>
          )}
        </main>
      </div>
    </div>
  );
}