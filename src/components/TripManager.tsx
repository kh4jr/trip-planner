"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import TripList from '@/components/TripList'; 
import TripTabs, { FullTrip } from "@/components/TripTabs"; 
import AuthModal from "@/components/AuthModal";
import CreateTripModal from "@/components/CreateTripModal"; // Upewnij się, że masz ten komponent!
import { Activity, Expense, Note, Todo, Participant } from "@prisma/client";
import { Session } from "next-auth";
import Link from 'next/link';

interface TripManagerProps {
  initialTrips: FullTrip[];
  session: Session | null;
  allAvailablePeople: Participant[];
}

export default function TripManager({ initialTrips, session, allAvailablePeople }: TripManagerProps) {
  const [trips, setTrips] = useState<FullTrip[]>(initialTrips);
  const [selectedTrip, setSelectedTrip] = useState<FullTrip | null>(initialTrips[0] || null);
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  
  const [isCreating, setIsCreating] = useState(false); 
  const [isLoggingIn, setIsLoggingIn] = useState(false); 
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  
  const [currentTripParticipants, setCurrentTripParticipants] = useState<Participant[]>([]);
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // Logika blokady edycji
  type SessionUser = { id: string; name?: string | null; email?: string | null };

  const sessionUserId = session?.user?.id ? Number(session.user.id) : null;
  
  const isReadOnly = !sessionUserId || (selectedTrip?.userId !== sessionUserId);
  // --- FILTROWANIE (NAPRAWIONE) ---
  // Filtrujemy stan 'trips', aby widzieć nowo dodane wyjazdy bez odświeżania strony
  const displayedTrips = activeTab === 'my' 
    ? trips.filter(t => t.userId === sessionUserId) 
    : trips;

  const userTrips = trips.filter((t: FullTrip) => {
  // Pokazujemy wycieczki gdzie user jest właścicielem LUB uczestnikiem
  return t.userId === sessionUserId || t.participants.some(p => p.userId === sessionUserId);
});

  useEffect(() => {
    if (selectedTrip) {    
      fetch(`/api/activities?tripId=${selectedTrip.id}`)
        .then(res => res.json())
        .then(data => setActivities(data))
        .catch(err => console.error("Błąd ładowania aktywności:", err));

      fetch(`/api/expenses?tripId=${selectedTrip.id}`)
        .then(res => res.json())
        .then(data => setExpenses(data))
        .catch(err => console.error("Błąd ładowania wydatków:", err));

      fetch(`/api/notes?tripId=${selectedTrip.id}`)
        .then(res => res.json())
        .then(data => setNotes(data))
        .catch(() => setNotes(selectedTrip.notes || []));

      fetch(`/api/todo?tripId=${selectedTrip.id}`)
        .then(res => res.json())
        .then(data => setTodos(data))
        .catch(() => setTodos(selectedTrip.todos || []));

      fetch(`/api/participants?tripId=${selectedTrip.id}`)
        .then(res => res.json())
        .then(data => setCurrentTripParticipants(data))
        .catch(err => {
          console.error("Błąd ładowania uczestników:", err);
          setCurrentTripParticipants(selectedTrip.participants || []);
        });
    }
}, [selectedTrip]);

  useEffect(() => {
    const loadTodos = async () => {
      if (!selectedTrip?.id) return;
      try {
        const res = await fetch(`/api/todo?tripId=${selectedTrip.id}`);
        if (res.ok) {
          const data = await res.json();
          setTodos(data);
        }
      } catch (err) {
        console.error("Nie udało się pobrać zadań", err);
      }
    };
    loadTodos();
  }, [selectedTrip?.id]);

  // --- HANDLERY (ZARZĄDZANIE STANEM) ---
  
  const handleAddActivity = (newAct: Activity) => setActivities(prev => [...prev, newAct]);
  const handleDeleteActivity = async (activityId: number) => setActivities(prev => prev.filter(a => a.id !== activityId));
  const handleAddExpense = (newExp: Expense) => setExpenses(prev => [...prev, newExp]);
  const handleAddNote = (newNote: Note) => setNotes(prev => [...prev, newNote]);
  
  const handleAddTodo = async (content: string, category: string) => {
    if (!selectedTrip) return;
    const response = await fetch('/api/todo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, category, tripId: selectedTrip.id }),
    });
    if (response.ok) {
      const newTodo = await response.json();
      setTodos((prev) => [...prev, newTodo]);
    }
  };

  const handleRemoveExpense = (id: number) => setExpenses(prev => prev.filter(x => x.id !== id));
  const handleUpdateNote = (id: number, done: boolean) => setNotes(prev => prev.map(n => n.id === id ? {...n, isCompleted: done} : n));
  const handleRemoveNote = (id: number) => setNotes(prev => prev.filter(x => x.id !== id));
  const handleUpdateTodo = (id: number, done: boolean) => setTodos(prev => prev.map(t => t.id === id ? {...t, isCompleted: done} : t));
  const handleRemoveTodo = (id: number) => setTodos(prev => prev.filter(x => x.id !== id));

  const handleTripCreated = (newTrip: FullTrip) => {
  setTrips(prev => [...prev, newTrip]);
  setSelectedTrip(newTrip);
  setIsCreating(false);
  setSelectedIds([]); // Czyścimy zaznaczone osoby
};

  return (
  <div className="!w-full !max-w-none min-h-screen bg-[#F8FAFC] !m-0 !p-0">
    {/* Tło gradientowe */}
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent pointer-events-none" />

    {/* HEADER - Przyklejony na sztywno do góry ekranu (Fixed) */}
    <header className="fixed top-0 left-0 right-0 z-[100] !w-full bg-white/90 backdrop-blur-md border-b border-blue-50 p-6 shadow-xl shadow-blue-100/20 flex justify-between items-center transition-all">
      <Link 
        href="/" 
        className="flex items-center gap-3 group transition-transform active:scale-95">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
            <span className="text-white text-xl">✈️</span>
          </div>
        <h1 className="text-3xl font-black text-blue-900 tracking-tighter">
          Trip<span className="text-blue-600">Planner</span>
        </h1>
      </Link>

      <div className="flex items-center space-x-6">
        {session ? (
          <div className="flex items-center gap-3">
            {/* KLIKALNY PROFIL - Przenosi do /profile */}
            <Link 
              href="/profile" 
              className="flex items-center gap-4 bg-white/80 hover:bg-white p-2 pr-4 rounded-2xl border border-blue-50 shadow-sm hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black shadow-md border-2 border-white group-hover:scale-105 transition-transform">
                {session.user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-black text-blue-900 leading-none mb-1 group-hover:text-blue-600 transition-colors">
                  {session.user?.name}
                </p>
                <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider group-hover:text-blue-500">
                  Twój profil
                </span>
              </div>
            </Link>

            {/* PRZYCISK WYLOGOWANIA - Z boku, osobno */}
            <button 
              onClick={() => signOut()} 
              className="p-2 px-3 hover:bg-red-50 rounded-xl transition-all group"
              title="Wyloguj się"
            >
              <span className="text-[10px] text-red-400 group-hover:text-red-600 font-black uppercase tracking-widest transition-colors">
                Wyloguj
              </span>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsLoggingIn(true)} 
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl shadow-xl shadow-blue-100 transition-all hover:scale-105"
          >
            Zaloguj się
          </button>
        )}
      </div>
    </header>

    <AuthModal isOpen={isLoggingIn} onClose={() => setIsLoggingIn(false)} />

    {/* GŁÓWNY KONTENER - odsunięty od góry o wysokość headera (!pt-28) */}
    <div className="relative z-10 !w-full !max-w-none flex flex-col !items-start !pt-32 !px-4 md:!px-8">
      
      {/* PRZEŁĄCZNIK WIDOKU */}
      <div className="flex bg-blue-50/50 p-1.5 rounded-[1.5rem] mb-8 w-fit border border-blue-100/50 !ml-0">
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'all' ? 'bg-white shadow-lg text-blue-600' : 'text-blue-300 hover:text-blue-500'}`}
        >
          Wszystkie wyjazdy
        </button>
        {session && (
          <button 
            onClick={() => setActiveTab('my')}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'my' ? 'bg-white shadow-lg text-blue-600' : 'text-blue-300 hover:text-blue-500'}`}
          >
            Moje wyjazdy
          </button>
        )}
      </div>

      {/* UKŁAD DWUKOLUMNOWY */}
      <div className="flex flex-col lg:flex-row gap-8 !w-full !items-start !justify-start">
        
        {/* LEWA KOLUMNA - Fixed na desktopie poniżej headera */}
        <aside className="w-full lg:w-80 shrink-0 lg:fixed lg:top-56 lg:z-40">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50">
            <h2 className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-6 text-left">
              {activeTab === 'my' ? 'Twoje Podróże' : 'Dostępne Podróże'}
            </h2>
            <TripList 
              trips={displayedTrips} 
              activeTripId={selectedTrip?.id || null} 
              onSelectTrip={(id) => setSelectedTrip(trips.find(t => t.id === id) || null)} 
            />
            
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              <span>+</span> Nowy Wyjazd
            </button>
          </div>
        </aside>

        {/* PRAWA KOLUMNA - Przesunięta o szerokość asida (lg:!ml-[340px]) */}
        <main className="flex-1 !w-full lg:!ml-[350px] min-w-0 !mr-0 pb-20">
          {selectedTrip ? (
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-blue-100/50 border border-blue-50 p-8 md:p-10 !w-full min-h-[600px]">
              <TripTabs 
                trip={selectedTrip} 
                userName={session?.user?.name || "Gość"}
                userTrips={userTrips}
                activities={activities}
                expenses={expenses}
                notes={notes}
                todos={todos}
                onAddExpense={handleAddExpense}
                onAddActivity={handleAddActivity}
                onDeleteActivity={handleDeleteActivity}
                onAddNote={handleAddNote}
                onAddTodo={handleAddTodo}
                onRemoveExpense={handleRemoveExpense}
                onUpdateNote={handleUpdateNote}
                onRemoveNote={handleRemoveNote}
                onUpdateTodo={handleUpdateTodo}
                onRemoveTodo={handleRemoveTodo}
                isReadOnly={isReadOnly}
                tripItems={[]}
                onAddItem={() => {}}
                onDeleteNote={handleRemoveNote}
                onToggleNote={async () => {}}
                onToggleItem={() => {}}
                onToggleTodo={handleUpdateTodo}
                onDeleteTodo={handleRemoveTodo}
                onDeleteTrip={async () => {}}
              />
            </div>
          ) : (
            <div className="h-[500px] !w-full border-4 border-dashed border-blue-50 rounded-[3.5rem] bg-blue-50/20 flex flex-col items-center justify-center text-center p-10">
              <div className="text-5xl mb-6 opacity-40">🗺️</div>
              <h3 className="text-xl font-black text-blue-900 mb-2">Brak wybranego celu</h3>
              <p className="text-blue-300 font-bold max-w-xs">Wybierz wyjazd z listy po lewej stronie, aby zarządzać planem.</p>
            </div>
          )}
        </main>

      </div>
    </div>

    {/* MODAL TWORZENIA */}
    {isCreating && (
      <CreateTripModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        allPeople={allAvailablePeople}
        selectedIds={selectedIds}       // Przekazujemy stan do modalu
        setSelectedIds={setSelectedIds} // Przekazujemy funkcję zmiany
        onSuccess={handleTripCreated}    // Używamy Twojej funkcji (zaświeci się na kolorowo)
      />
    )}
  </div>
);
}