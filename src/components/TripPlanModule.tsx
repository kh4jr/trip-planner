// src/components/TripPlanModule.tsx
// To jest dawny TripDetails, który teraz działa jako moduł w zakładce.
"use client";

import { Activity } from "@/lib/data"; 

interface TripPlanModuleProps {
  // Nie potrzebuje już propa 'trip', bo to TripTabs renderuje nagłówek.
  activities: Activity[];
  onAddActivity: () => void; 
  onDeleteActivity: (id: number) => void; 
  // Nie potrzebuje już propa 'onDeleteTrip', bo to TripTabs obsługuje usuwanie wyjazdu.
}

export default function TripPlanModule({ 
    activities, 
    onAddActivity, 
    onDeleteActivity 
}: TripPlanModuleProps) {
  
  return (
    <div>
      {/* UWAGA: W tym module usunęliśmy nagłówek z informacjami o wyjeździe 
        i przycisk Usuń Wyjazd, ponieważ są one teraz w TripTabs.tsx.
      */}
      
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Zaplanowane Aktywności</h3>
      
      {activities.length > 0 ? (
        <ul className="space-y-3">
          {activities.map(activity => (
            <li 
                key={activity.id} 
                className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center transition duration-150 ease-in-out hover:shadow-sm"
            >
              <div className="flex-1">
                <span className="font-medium text-gray-900">{activity.time}:</span> {activity.description}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-blue-500 bg-blue-50 py-1 px-2 rounded-full">
                  Odp.: {activity.assignedTo || "Brak"}
                </span>
                
                {/* PRZYCISK USUWANIA AKTYWNOŚCI */}
                <button
                  onClick={() => {
                     if (window.confirm(`Czy na pewno usunąć "${activity.description}"?`)) {
                          onDeleteActivity(activity.id);
                     }
                  }}
                  className="text-red-500 hover:text-700 p-1 rounded-full hover:bg-red-100 transition"
                  title="Usuń aktywność"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 italic">Brak zaplanowanych aktywności. Dodaj pierwszą!</p>
      )}

      {/* Przycisk do dodawania nowej aktywności */}
      <div className="mt-6">
        <button 
          onClick={onAddActivity}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          + Dodaj Aktywność do Planu
        </button>
      </div>
    </div>
  );
}