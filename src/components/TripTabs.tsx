"use client";
import { useState } from 'react';
import { Trip, Activity, Expense, TripItem, Note } from '@/lib/data'; 
import TripDetails from './TripPlanModule';  
import BudgetModule from './BudgetModule'; 
import TasksModule from './TasksModule';  
import NotesModule from './NotesModule';

interface TripTabsProps {
    trip: Trip;
    activities: Activity[];
    expenses: Expense[]; // NOWY PROP
    tripItems: TripItem[]; // NOWY PROP
    notes: Note[]; // NOWY PROP
    
    // Funkcje do zarządzania stanem
    onAddActivity: () => void;
    onAddExpense: (expense: Expense) => void; // Będziemy implementować
    onToggleItem: (itemId: number) => void; // Będziemy implementować
    onDeleteTrip: (id: number) => void;
    onDeleteActivity: (id: number) => void;
    onAddNote: (note: Note) => void; // NOWA FUNKCJA
}

const TABS = [
    { id: 'plan', label: 'Plan Podróży' },
    { id: 'budget', label: 'Budżet 💸' },
    { id: 'tasks', label: 'Zadania/Pakowanie' },
    { id: 'photos', label: 'Zdjęcia 📸' }, // Na przyszłość
    { id: 'notes', label: 'Notatki 📝' },  // Na przyszłość
    { id: 'chat', label: 'Czat 💬' }   // Na przyszłość
];

export default function TripTabs(props: TripTabsProps) {
    const [activeTab, setActiveTab] = useState('plan');

    // Komponent Tab Button
    const TabButton = ({ id, label }: { id: string, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`py-2 px-4 text-sm font-medium transition-colors duration-200
                ${activeTab === id 
                    ? 'border-b-2 border-blue-600 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`
            }
        >
            {label}
        </button>
    );

    const participantsMap = new Map(props.trip.participants.map(p => [p.id, p]));

    return (
        <div>
            {/* 1. NAGŁÓWEK SZCZEGÓŁÓW (Góra) */}
            <div className="flex justify-between items-start border-b pb-4 mb-4">
                {/* Przywrócony widok informacji o wyjeździe */}
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{props.trip.name}</h2>
                    <p className="text-lg text-blue-600 mb-2">{props.trip.destination}</p>
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold">Daty:</span> {props.trip.startDate} do {props.trip.endDate} | 
                        <span className="font-semibold ml-2">Uczestnicy:</span> {props.trip.participants.map(p => p.name).join(', ')}
                    </div>
                </div>
                
                {/* Przycisk Usuń Wyjazd */}
                <button
                    onClick={() => {
                        if (window.confirm(`Czy na pewno chcesz usunąć wyjazd "${props.trip.name}"?`)) {
                            props.onDeleteTrip(props.trip.id);
                        }
                    }}
                    className="text-white bg-red-500 hover:bg-red-600 font-bold py-1 px-3 rounded text-sm transition"
                >
                    Usuń Wyjazd
                </button>
            </div>

            {/* 2. ZAKŁADKI (TABS) */}
            <div className="border-b mb-6 flex space-x-4">
                {TABS.map(tab => <TabButton key={tab.id} id={tab.id} label={tab.label} />)}
            </div>

            {/* 3. KONTENER ZAWARTOŚCI */}
            <div>
                {activeTab === 'plan' && (
                    // Używamy TripDetails jako modułu Planu
                    <TripDetails 
                        activities={props.activities} 
                        onAddActivity={props.onAddActivity}
                        onDeleteActivity={props.onDeleteActivity}
                    />
                )}
                
                {activeTab === 'budget' && (
                    <BudgetModule 
                        tripId={props.trip.id}
                        expenses={props.expenses} 
                        participants={props.trip.participants}
                        onAddExpense={props.onAddExpense}
                        participantsMap={participantsMap}
                    />
                )}

                {activeTab === 'tasks' && (
                    <TasksModule
                         tripId={props.trip.id}
                         tripItems={props.tripItems}
                         participantsMap={participantsMap}
                         onToggleItem={props.onToggleItem}
                         // W przyszłości: onAddItem, onDeleteItem
                    />
                )}

                {activeTab === 'photo' && (
                    <div className="p-4">
                        <h3 className="text-xl font-semibold">Moduł foto - W Budowie!</h3>
                        <p className="text-gray-600 mt-2">Ta funkcja będzie dostępna w przyszłych aktualizacjach.</p>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="bg-white p-6 rounded-xl shadow-lg mt-4">
                    <NotesModule
                        tripId={props.trip.id}
                        notes={props.notes} // Przekazujemy prawdziwe notatki z propsów
                        onAddNote={props.onAddNote} // Przekazujemy prawdziwą funkcję zapisu
                    />    
                    </div>
                )}
            </div>
        </div>
    );
}

