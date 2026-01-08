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
    //{ id: 'chat', label: 'Czat 💬' }   // Na przyszłość
];

//const today = new Date().toISOString().split('T')[0];

export default function TripTabs(props: TripTabsProps) {
    const [activeTab, setActiveTab] = useState('plan');

    // Komponent przycisku zakładki
    const TabButton = ({ id, label }: { id: string, label: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`py-2 px-4 text-sm font-medium transition-all duration-200 border-b-2 
                ${activeTab === id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
            }
        >
            {label}
        </button>
    );

    const participantsMap = new Map(props.trip.participants.map(p => [p.id, p]));

    return (
        <div className="space-y-4">
            {/* 1. NAGŁÓWEK SZCZEGÓŁÓW */}
            <div className="flex justify-between items-start border-b pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{props.trip.name}</h2>
                    <p className="text-lg text-blue-600 mb-2">{props.trip.destination}</p>
                    <div className="text-sm text-gray-600">
                        <span className="font-semibold">Daty:</span> {props.trip.startDate} do {props.trip.endDate}
                        <span className="mx-2">|</span>
                        <span className="font-semibold">Uczestnicy:</span> {props.trip.participants.map(p => p.name).join(', ')}
                    </div>
                </div>
                
                <button
                    onClick={() => {
                        if (window.confirm(`Czy na pewno chcesz usunąć wyjazd "${props.trip.name}"?`)) {
                            props.onDeleteTrip(props.trip.id);
                        }
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm"
                >
                    Usuń Wyjazd
                </button>
            </div>

            {/* 2. MENU ZAKŁADEK */}
            <div className="flex space-x-2 border-b overflow-x-auto">
                {TABS.map(tab => <TabButton key={tab.id} id={tab.id} label={tab.label} />)}
            </div>

            {/* 3. TREŚĆ ZAKŁADEK */}
            <div className="mt-4">
                {activeTab === 'plan' && (
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
                    />
                )}

                {activeTab === 'photos' && (
                    <div className="p-10 text-center bg-gray-50 rounded-xl border-2 border-dashed">
                        <h3 className="text-xl font-semibold text-gray-400">Moduł zdjęć w budowie 📸</h3>
                        <p className="text-gray-400 mt-2">Wkrótce będziesz mógł tutaj dodawać wspomnienia z podróży.</p>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="bg-white p-2 rounded-xl">
                        <NotesModule
                            tripId={props.trip.id}
                            notes={props.notes} 
                            onAddNote={props.onAddNote}
                        />    
                    </div>
                )}
            </div>
        </div>
    );
}