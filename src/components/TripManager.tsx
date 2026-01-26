"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import TripList from '@/components/TripList'; 
import TripTabs, { FullTrip } from "@/components/TripTabs"; 
import TripForm from "@/components/TripForm";
import AuthModal from "@/components/AuthModal";
// Importujemy typy WYŁĄCZNIE z Prisma, aby uniknąć konfliktów z starymi danymi
import { Activity, Expense, TripItem, Note, Todo } from "@prisma/client";
import { addExpense, addNote, toggleNote } from "@/lib/actions";

export default function TripManager({ initialTrips }: { initialTrips: FullTrip[] }) {
  const { data: session } = useSession();
  const [trips, setTrips] = useState<FullTrip[]>(initialTrips);
  const [selectedTrip, setSelectedTrip] = useState<FullTrip | null>(trips[0] || null);
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  
  const [isCreating, setIsCreating] = useState(false); 
  const [isLoggingIn, setIsLoggingIn] = useState(false); 

  // Ładowanie wszystkich danych po zmianie wyjazdu (jeden useEffect zamiast kilku)
  useEffect(() => {
    if (selectedTrip) {
      // 1. Pobieranie aktywności
      fetch(`/api/activities?tripId=${selectedTrip.id}`)
        .then(res => res.json())
        .then(data => setActivities(data))
        .catch(err => console.error("Błąd ładowania aktywności:", err));

      // 2. Pobieranie wydatków
      fetch(`/api/expenses?tripId=${selectedTrip.id}`)
        .then(res => res.json())
        .then(data => setExpenses(data))
        .catch(err => console.error("Błąd ładowania wydatków:", err));

      // 3. Pobieranie notatek
      fetch(`/api/notes?tripId=${selectedTrip.id}`)
        .then(res => res.json())
        .then(data => setNotes(data))
        .catch(() => {
           // Jeśli API zawiedzie, bierzemy notatki z obiektu wyjazdu (rzutowanie na any tylko dla bezpieczeństwa)
           setNotes(selectedTrip.notes || []);
        });
    }
  }, [selectedTrip]);

  useEffect(() => {
    const loadTodos = async () => {
      if (!selectedTrip?.id) return;
      try {
        const res = await fetch(`/api/trips/${selectedTrip.id}/todos`);
        if (res.ok) {
          const data = await res.json();
          setTodos(data); // To sprawia, że lista przestaje być pusta
        }
      } catch (err) {
        console.error("Nie udało się pobrać zadań", err);
      }
    };

  loadTodos();
}, [selectedTrip?.id]);

  // Handler dla Aktywności
  const handleAddActivity = (newAct: Activity) => {
    setActivities(prev => [...prev, newAct]);
  };

  const handleDeleteActivity = async (activityId: number) => {
    // Tutaj możesz dodać akcję usuwania z bazy
    setActivities(prev => prev.filter(a => a.id !== activityId));
  };

  // Handler dla Wydatków
  const handleAddExpense = (newExp: Expense) => {
    setExpenses(prev => [...prev, newExp]);
  };

  // Handler dla Notatek (z zachowaniem autora i statusu skreślenia)
  const handleAddNote = (newNote: Note) => {
    setNotes(prev => [...prev, newNote]);
  };

  const handleDeleteNote = async (id: number) => {
    await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
  setNotes(prev => prev.filter(n => n.id !== id));
};

  const handleToggleNote = async (id: number, isCompleted: boolean) => {
    await fetch(`/api/notes`, {
    method: 'PATCH',
    body: JSON.stringify({ id, isCompleted })
  });
  setNotes(prev => prev.map(n => n.id === id ? { ...n, isCompleted } : n));
};

  const handleAddTodo = async (content: string, category: string) => {
    if (!selectedTrip) return;

  try {
    const response = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        category,
        tripId: selectedTrip.id,
      }),
    });

    if (response.ok) {
      const newTodo = await response.json();
      // To jest kluczowe: aktualizujesz stan w TripManager, 
      // co automatycznie odświeży TripTabs
      setTodos((prev) => [...prev, newTodo]);
    }
  } catch (error) {
    console.error("Błąd podczas dodawania zadania:", error);
  }
};

  const handleToggleTodo = async (id: number, completed: boolean) => { // upewnij się, że tu jest 'completed'
  try {
    const response = await fetch('/api/todos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed }), // poprawiono z isCompleted na completed
    });

    if (response.ok) {
      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, isCompleted: completed } : t 
      ));
    }
  } catch (error) {
    console.error("Błąd aktualizacji zadania:", error);
  }
};

const handleDeleteTodo = async (id: number) => {
  try {
    const response = await fetch(`/api/todo?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      setTodos(prev => prev.filter(t => t.id !== id));
    }
  } catch (error) {
    console.error("Błąd usuwania zadania:", error);
  }
};


  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <header className="bg-white border-b border-gray-200 p-4 mb-8 rounded-2xl shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">TripPlanner</h1>
        <div className="flex items-center space-x-4">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-800 leading-none">{session.user?.name}</p>
                <button onClick={() => signOut()} className="text-xs text-red-500 font-semibold">Wyloguj się</button>
              </div>
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {session.user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <button onClick={() => setIsLoggingIn(true)} className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl">Zaloguj się</button>
          )}
        </div>
      </header>

      <AuthModal isOpen={isLoggingIn} onClose={() => setIsLoggingIn(false)} />

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
              className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md transition-transform hover:scale-[1.02]"
            >
              + Nowy Wyjazd
            </button>
          </div>
        </aside>

        <main className="flex-1">
          {selectedTrip ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <TripTabs 
                trip={selectedTrip} 
                userName={session?.user?.name || "Yaroslav"}
                activities={activities}
                expenses={expenses}
                notes={notes}
                todos={todos}
                onAddExpense={handleAddExpense}
                onAddActivity={handleAddActivity}
                onDeleteActivity={handleDeleteActivity}
                onDeleteTrip={async (id) => { /* Logika usuwania wyjazdu */ }}
                tripItems={[]} 
                onAddItem={() => {}} 
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onToggleNote={handleToggleNote}
                onToggleItem={() => {}}
                onAddTodo={handleAddTodo}
                onToggleTodo={handleToggleTodo} // BRAKOWAŁO TEGO
                onDeleteTodo={handleDeleteTodo}
              />
            </div>
          ) : (
            <div className="text-center p-20 border-2 border-dashed rounded-2xl text-gray-400">
              Wybierz wyjazd z listy po lewej, aby zobaczyć szczegóły.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}