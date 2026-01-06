"use client"; 

import { Component, useState } from "react";
//import Image from "next/image";
import AuthButton from '@/components/AuthButton';
import TripList from '@/components/TripList'; 
import TripTabs from "@/components/TripTabs"; 
import TripForm from "@/components/TripForm";
import ActivityForm from "@/components/ActivityForm";
import { MOCK_TRIPS, MOCK_ACTIVITIES, MOCK_EXPENSES, MOCK_ITEMS, Trip, Activity, Expense, TripItem, Note } from '@/lib/data';
import ThemeSwitcher from '@/components/ThemeSwicher';
//import '@styles/globals.css';

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES); // NOWY STAN
  const [tripItems, setTripItems] = useState<TripItem[]>(MOCK_ITEMS); // NOWY STAN
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(trips[0] || null);
  const [isCreating, setIsCreating] = useState(false); 
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]); // NOWY STAN



  // Funkcja dodająca nowy wyjazd do stanu
  const handleAddTrip = (newTrip: Trip) => {
    setTrips(prevTrips => [newTrip, ...prevTrips]);
    setSelectedTrip(newTrip); // Wybierz nowo utworzony wyjazd
    setIsCreating(false); // Ukryj formularz
  };
  
  // Funkcja do zamykania formularza
  const handleCancelCreate = () => {
    setIsCreating(false);
  };

  // Dodawanie aktywności
  const handleAddActivity = (newActivity: Activity) => {
    setActivities(prevActivities => [newActivity, ...prevActivities]);
    setIsAddingActivity(false); // Ukryj formularz
  };

// FUNKCJA USUWANIA WYJAZDU
  const handleDeleteTrip = (tripId: number) => {
    setTrips(prevTrips => prevTrips.filter(t => t.id !== tripId));
    setActivities(prevActivities => prevActivities.filter(a => a.tripId !== tripId));
    setExpenses(prevExpenses => prevExpenses.filter(e => e.tripId !== tripId)); // <-- DODANE
    setTripItems(prevItems => prevItems.filter(item => item.tripId !== tripId)); // <-- DODANE
    // ... (aktualizacja selectedTrip)
    if (selectedTrip?.id === tripId) {
      setSelectedTrip(trips.find(t => t.id !== tripId) || null); 
    }
  };

  // FUNKCJA USUWANIA AKTYWNOŚCI
  const handleDeleteActivity = (activityId: number) => {
    // Usuń aktywność z listy
    setActivities(prevActivities => prevActivities.filter(a => a.id !== activityId));
  };

const handleAddExpense = (newExpense: Expense) => {
    // console.log("Dodawanie wydatku:", newExpense);  
    setExpenses(prevExpenses => [newExpense, ...prevExpenses]); // USUŃ "//" Z TEJ LINII
};

// NOWA FUNKCJA: Przełączanie statusu zadania/pakowania
const handleToggleItem = (itemId: number) => {
    setTripItems(prevItems => prevItems.map(item => 
        // Jeśli ID się zgadza, odwróć wartość isCompleted
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    ));
};

const handleAddNote = (newNote: Note) => {
    setNotes((prev) => [newNote, ...prev]);
};

  // (Użyj swojego kodu nagłówka z AuthButton)
  const Header = () => (
    <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">TripPlanner</h1>
        
        {/* Kontener dla przełącznika i przycisku Auth */}
        <div className="flex items-center space-x-4"> 
            <ThemeSwitcher /> 
            <AuthButton />
        </div>
    </header>
  );
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* GŁÓWNY KONTENER CENTRUJĄCY */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* GÓRNY RZĄD: LEWY + PRAWY KONTENER */}
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* LEWY KONTENER (Lista Wyjazdów LUB Formularz) */}
          <div className="md:w-1/3 bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-blue-800 border-b pb-2 mb-4">
              {isCreating ? 'Dodaj Nowy Wyjazd' : `Twoje Wyjazdy (${trips.length})`}
            </h2>
            
            {isCreating ? (
              <TripForm 
                onSave={handleAddTrip} 
                onCancel={handleCancelCreate}
              />
            ) : (
              <>
                <TripList 
                  trips={trips} 
                  onSelect={setSelectedTrip}
                  selectedId={selectedTrip?.id} 
                />
                <button 
                  onClick={() => setIsCreating(true)}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded transition-all"
                >
                  + Dodaj Nowy Wyjazd
                </button>
              </>
            )}
          </div>

          {/* PRAWY KONTENER (Szczegóły Wybranego Planu) */}
          <div className="md:w-2/3 bg-white p-6 rounded-xl shadow-lg">
            {selectedTrip ? (
              isAddingActivity ? (
                <ActivityForm
                  tripId={selectedTrip.id}
                  participants={selectedTrip.participants.map(p => p.name)} 
                  onSave={handleAddActivity}
                  onCancel={() => setIsAddingActivity(false)}
                />
              ) : (
                <TripTabs 
                  trip={selectedTrip} 
                  activities={activities.filter(a => a.tripId === selectedTrip.id)}
                  expenses={expenses.filter(e => e.tripId === selectedTrip.id)}
                  tripItems={tripItems.filter(item => item.tripId === selectedTrip.id)}
                  notes={notes.filter(n => n.tripId === selectedTrip.id)}
                  onAddNote={handleAddNote}
                  onAddActivity={() => setIsAddingActivity(true)} 
                  onDeleteActivity={handleDeleteActivity}
                  onDeleteTrip={handleDeleteTrip} 
                  onAddExpense={handleAddExpense}
                  onToggleItem={handleToggleItem}
                />
              )
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500 italic">Wybierz wyjazd z listy lub dodaj nowy, aby zobaczyć szczegóły.</p>
              </div>
            )}
          </div>
        </div>

        {/* DOLNY KONTENER (POD LEWYM I PRAWYM) */}
        <div className="w-full bg-white p-6 rounded-xl shadow-lg transition-all">
          <h2 className="text-xl font-semibold text-blue-800 border-b pb-2 mb-4">
            Statystyki / Podsumowanie Ogólne
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
              <p className="text-sm text-gray-500 uppercase font-medium">Wszystkie wyjazdy</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{trips.length}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-100 shadow-sm">
              <p className="text-sm text-gray-500 uppercase font-medium">Aktywne zadania</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {tripItems.filter(i => !i.isCompleted).length}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 shadow-sm">
              <p className="text-sm text-gray-500 uppercase font-medium">Liczba notatek</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{notes.length}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}