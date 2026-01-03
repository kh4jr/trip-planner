"use client"; 

import { Component, useState } from "react";
//import Image from "next/image";
import AuthButton from '@/components/AuthButton';
import TripList from '@/components/TripList'; 
import TripTabs from "@/components/TripTabs"; 
import TripForm from "@/components/TripForm";
import ActivityForm from "@/components/ActivityForm";
import { MOCK_TRIPS, MOCK_ACTIVITIES, MOCK_EXPENSES, MOCK_ITEMS, Trip, Activity, Expense, TripItem } from '@/lib/data';
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

  // NOWA FUNKCJA: Dodawanie Wydatku
const handleAddExpense = (newExpense: Expense) => {
    setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
    // W przyszłości możesz dodać logikę do automatycznego przełączania na zakładkę "Budżet", jeśli użytkownik był w innym miejscu
};

// NOWA FUNKCJA: Przełączanie statusu zadania/pakowania
const handleToggleItem = (itemId: number) => {
    setTripItems(prevItems => prevItems.map(item => 
        // Jeśli ID się zgadza, odwróć wartość isCompleted
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    ));
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
      
      {/* GŁÓWNY KONTENER LAYOUTU */}
      <div className="flex flex-col md:flex-row p-4 md:p-8 max-w-7xl mx-auto gap-6">
        
        {/* LEWY KONTENER (Lista Wyjazdów LUB Formularz) */}
        <div className="md:w-1/3 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-blue-800 border-b pb-2 mb-4">
            {isCreating ? 'Dodaj Nowy Wyjazd' : `Twoje Wyjazdy (${trips.length})`}
          </h2>
          
          {isCreating ? (
            // Wyświetl formularz tworzenia
            <TripForm 
              onSave={handleAddTrip} 
              onCancel={handleCancelCreate}
            />
          ) : (
            // Wyświetl listę wyjazdów
            <>
              <TripList 
                trips={trips} 
                onSelect={setSelectedTrip}
                selectedId={selectedTrip?.id} 
              />
              <button 
                onClick={() => setIsCreating(true)} // <-- ZMIANA: Przełączamy stan
                className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
              >
                + Dodaj Nowy Wyjazd
              </button>
            </>
          )}
        </div>

        {/* PRAWY KONTENER (Szczegóły Wybranego Planu) */}
        {}
        <div className="md:w-2/3 bg-white p-6 rounded-xl shadow-lg">
          {selectedTrip ? (
            isAddingActivity ? (
                // WIDOK 1: Wyświetl formularz aktywności
                <ActivityForm
                    tripId={selectedTrip.id}
                    // ZMIANA TUTAJ: Konwertujemy tablicę obiektów Participant[] na tablicę stringów (imion)
                    participants={selectedTrip.participants.map(p => p.name)} 
                    onSave={handleAddActivity}
                    onCancel={() => setIsAddingActivity(false)}
                    />
            ) : (
                // WIDOK 2: Wyświetl szczegóły
                <TripTabs 
                    trip={selectedTrip} 
                    activities={activities.filter(a => a.tripId === selectedTrip.id)}
                    expenses={expenses.filter(e => e.tripId === selectedTrip.id)} // <-- PRZEKAZUJEMY WYDATKI
                    tripItems={tripItems.filter(item => item.tripId === selectedTrip.id)} // <-- PRZEKAZUJEMY ZADANIA
                    
                    onAddActivity={() => setIsAddingActivity(true)} 
                    onDeleteActivity={handleDeleteActivity}
                    onDeleteTrip={handleDeleteTrip} 
                    
                    onAddExpense={handleAddExpense} // <-- NOWY PROP
                    onToggleItem={handleToggleItem} // <-- NOWY PROP
                />
            )
          ) : (
            <p className="text-gray-500">Wybierz wyjazd z listy lub dodaj nowy, aby zobaczyć szczegóły.</p>
          )}
        </div>
      </div>
    </div>
  );
}
