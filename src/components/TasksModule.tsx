"use client";

import { TripItem, Participant } from '@/lib/data';

interface TasksModuleProps {
    tripId: number;
    tripItems: TripItem[];
    participantsMap: Map<string, Participant>;
    onToggleItem: (itemId: number) => void;
}

export default function TasksModule({ tripItems, participantsMap, onToggleItem }: TasksModuleProps) {
    const packingList = tripItems.filter(item => item.type === 'packing');
    const todoList = tripItems.filter(item => item.type === 'todo');

    const renderList = (list: TripItem[], title: string) => (
        <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">{title}</h3>
            <ul className="space-y-3">
                {list.map(item => (
                    <li key={item.id} className={`p-3 rounded-lg flex items-center justify-between transition-colors ${item.isCompleted ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={item.isCompleted}
                                onChange={() => onToggleItem(item.id)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <span className={`ml-3 ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {item.description}
                            </span>
                        </div>
                        <div className="text-sm text-blue-500">
                            {item.assignedToId ? `Odp.: ${participantsMap.get(item.assignedToId)?.name}` : 'Nieprzypisane'}
                        </div>
                    </li>
                ))}
            </ul>
             <button 
                onClick={() => alert(`W przyszłości otworzę formularz dodawania ${title.toLowerCase()}!`) /* setIsAddingItem(true) */}
                className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-4 rounded text-sm"
            >
                + Dodaj {title === 'Lista Pakowania' ? 'Rzecz' : 'Zadanie'}
            </button>
        </div>
    );

    return (
        <div>
            {renderList(packingList, 'Lista Pakowania')}
            <hr className="my-6" />
            {renderList(todoList, 'Zadania do Wykonania')}
        </div>
    );
}