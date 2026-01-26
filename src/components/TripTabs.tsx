'use client';

import { useState } from "react";
import { addExpense, addNote } from "@/lib/actions";
import { Trip, Participant, Activity, Expense, Note, Todo, TripItem } from "@prisma/client";

export type FullTrip = Trip & { 
    participants: Participant[] 
    activities: Activity[];
    expenses: Expense[];
    notes: Note[];      // To musi tu być, aby TripManager przestał sypać błędami
    items: TripItem[];
};

interface TripTabsProps {
  trip: FullTrip;
  userName: string;
  activities: Activity[];
  expenses: Expense[];
  tripItems: TripItem[];
  notes: Note[];
  //items: Todo[],
  todos: Todo[];
  onDeleteTrip: (id: number) => Promise<void>;
  onAddActivity: (activity: Activity) => void; 
  onAddExpense: (expense: Expense) => void;
  onAddItem: (item: TripItem) => void;
  onAddNote: (note: Note) => void;
  onAddTodo: (content: string, category: string) => Promise<void>;
  onDeleteActivity: (id: number) => Promise<void>;
  onToggleItem: (id: number) => void;
  onToggleNote: (noteId: number, isCompleted: boolean) => void;
  onDeleteNote: (id: number) => void;
  onToggleTodo: (id: number, completed: boolean) => void;
  onDeleteTodo: (id: number) => void;
  
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
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityTime, setNewActivityTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [newTodoText, setNewTodoText] = useState("");
  const [todoCategory, setTodoCategory] = useState("Ubrania");

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
          tripId: props.trip.id
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

  const handleSaveExpense = async () => {
    if (!expenseDesc || !expenseAmount || !paidBy) return;

    setLoading(true);
    try {
      // 1. Wysyłamy dane do bazy przez akcję serverową
      const saved = await addExpense(props.trip.id, {
        description: expenseDesc,
        amount: parseFloat(expenseAmount),
        paidBy: paidBy
      });

      // 2. Przekazujemy 'saved' bezpośrednio do góry (do TripManager).
      // NIE dodajemy już category ani date, bo ich nie ma w modelu Prisma!
      if (props.onAddExpense) {
        props.onAddExpense(saved);
      }

      // 3. Czyścimy formularz
      setExpenseDesc("");
      setExpenseAmount("");
      setPaidBy("");
      setIsAddingExpense(false);
    } catch (error) {
      console.error("Błąd zapisu:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSettlements = () => {
    const total = props.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const participants = props.trip.participants.map(p => p.name);
    if (participants.length === 0) return { total, perPerson: total, balances: [] };

    const perPerson = total / participants.length;
    const spentByEach: Record<string, number> = {};
    participants.forEach(p => spentByEach[p] = 0);
    props.expenses.forEach(exp => {
      spentByEach[exp.paidBy] = (spentByEach[exp.paidBy] || 0) + Number(exp.amount);
    });

    const balances = participants.map(p => ({
      name: p,
      balance: spentByEach[p] - perPerson
    }));

    return { total, perPerson, balances };
  };

  const handleSaveNote = async () => {
    if (!newNoteText.trim()) return;
  
  setLoading(true);
  try {
    // Przesyłamy 3 argumenty oddzielone przecinkami (bez klamerek {})
    const saved = await addNote(
      props.trip.id, 
      newNoteText, 
      props.userName // Teraz to zadziała, bo dodaliśmy to do interface
    );
    
    props.onAddNote(saved);
    setNewNoteText("");
  } catch (error) {
    console.error("Błąd zapisu notatki:", error);
  } finally {
    setLoading(false);
  }
};

  const handleSaveTodo = async () => {
    if (!newTodoText.trim()) return;
  setLoading(true);
  try {
    // Teraz onAddTodo przyjmuje 2 argumenty zgodnie z nowym interfejsem
    await props.onAddTodo(newTodoText, todoCategory); 
    setNewTodoText("");
  } finally {
    setLoading(false);
  }
};

  const groupedTodos = props.todos.reduce((acc, todo) => {
  const cat = todo.category || "Inne";
    if (!acc[cat]) acc[cat] = [];
  acc[cat].push(todo);
    return acc;
}, 
  {} as Record<string, typeof props.todos>);

  const { total, perPerson, balances } = calculateSettlements();

    return (
    <div className="space-y-4">
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-start border-b pb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{props.trip.name}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg text-blue-600 font-semibold">{props.trip.destination}</p>
            <span className="text-gray-300">|</span>
            <div className="flex -space-x-2">
              {props.trip.participants.map((p) => (
                <div 
                  key={p.id} 
                  title={p.name}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm"
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500 font-medium italic">
              {props.trip.participants.length > 0 
                ? props.trip.participants.map(p => p.name).join(", ") 
                : "Brak uczestników"}
            </span>
          </div>
        </div>
        <button
          onClick={() => props.onDeleteTrip(props.trip.id)}
          className="bg-red-50 hover:bg-red-100 text-red-500 font-bold py-2 px-4 rounded-xl text-sm transition-all border border-red-100 shadow-sm"
        >
          Usuń Wyjazd
        </button>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex space-x-2 border-b overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="mt-4 text-gray-900">
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-700">Twój Plan</h3>
              <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                Aktywności: {props.activities.length}
              </span>
            </div>

            {isAddingActivity ? (
              <div className="bg-blue-50/50 p-5 rounded-2xl border-2 border-blue-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    placeholder="Co planujesz?" 
                    className="w-full p-3 border-2 border-white rounded-xl outline-none focus:border-blue-500 shadow-sm"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                  />
                  <input 
                    type="datetime-local" 
                    className="w-full p-3 border-2 border-white rounded-xl outline-none focus:border-blue-500 shadow-sm"
                    value={newActivityTime}
                    onChange={(e) => setNewActivityTime(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSaveActivity} disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg">
                    {loading ? "Zapisywanie..." : "Zapisz w planie"}
                  </button>
                  <button onClick={() => setIsAddingActivity(false)} className="px-6 py-3 bg-white text-gray-500 font-semibold rounded-xl">
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingActivity(true)} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-blue-500 transition-all font-medium">
                + Dodaj nową aktywność
              </button>
            )}

            <div className="space-y-3">
              {props.activities.map((act) => (
                <div key={act.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm group">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg font-bold text-xs min-w-[70px]">
                    {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800">{act.name}</h4>
                  </div>
                  <button onClick={() => props.onDeleteActivity(act.id)} className="opacity-0 group-hover:opacity-100 text-red-400">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                <p className="text-sm text-green-600 font-bold uppercase tracking-wider">Suma wydatków</p>
                <p className="text-4xl font-black text-green-700">{total.toFixed(2)} zł</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">Na osobę</p>
                <p className="text-4xl font-black text-blue-700">{perPerson.toFixed(2)} zł</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Kto komu ile winien?</h3>
              <div className="space-y-3">
                {balances.map(b => (
                  <div key={b.name} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <span className="font-bold text-gray-700">{b.name}</span>
                    <span className={`font-black ${b.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {b.balance >= 0 ? `Dostanie: +${b.balance.toFixed(2)}` : `Musi oddać: ${Math.abs(b.balance).toFixed(2)}`} zł
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {isAddingExpense ? (
              <div className="bg-white p-6 rounded-2xl border-2 border-green-200 space-y-4 shadow-xl">
                <input 
                  placeholder="np. Bilety do muzeum" 
                  className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-green-500"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-green-500"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                  />
                  <select 
                    className="w-full p-3 border-2 border-gray-100 rounded-xl bg-white outline-none focus:border-green-500 font-medium"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                  >
                    <option value="">Wybierz osobę...</option>
                    {props.trip.participants?.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveExpense} disabled={loading} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg">
                    {loading ? "Zapisywanie..." : "Zapisz wydatek"}
                  </button>
                  <button onClick={() => setIsAddingExpense(false)} className="px-6 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl">
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingExpense(true)} className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg">
                + Dodaj nowy wydatek
              </button>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Historia wydatków</h3>
              {props.expenses.length === 0 ? (
                <p className="text-gray-400 text-sm italic ml-1">Brak zarejestrowanych wydatków.</p>
              ) : (
                props.expenses.map(exp => (
                  <div key={exp.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                      <p className="font-bold text-gray-800">{exp.description}</p>
                      <p className="text-xs text-gray-500">Zapłacił(a): <span className="text-blue-600">{exp.paidBy}</span></p>
                    </div>
                    <p className="font-black text-gray-900 text-lg">{Number(exp.amount).toFixed(2)} zł</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SEKCJA NOTATEK - Z DODATKOWYMI FUNKCJAMI */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Dodaj nową notatkę..."
                className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
              />
              <button
                onClick={handleSaveNote}
                disabled={loading || !newNoteText.trim()}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl disabled:bg-gray-300 transition-colors"
              >
                Dodaj
              </button>
            </div>

            <div className="grid gap-3">
              {props.notes.length === 0 ? (
                <p className="text-center text-gray-400 py-10">Brak notatek. Dodaj pierwszą!</p>
              ) : (
                props.notes.map((note) => (
                  <div 
                    key={note.id}
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3 group ${
                      note.isCompleted ? "bg-gray-50 border-gray-100" : "bg-white border-gray-200 shadow-sm"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={note.isCompleted}
                      onChange={() => props.onToggleNote(note.id, !note.isCompleted)}
                      className="mt-1.5 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className={`text-gray-800 leading-relaxed ${note.isCompleted ? "line-through text-gray-400" : ""}`}>
                        {note.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                          Dodano: {new Date(note.createdAt).toLocaleString()} przez {note.author}
                        </span>
                        {note.isCompleted && (
                          <span className="text-[10px] font-medium italic text-blue-500">
                            Skreślone przez: {props.userName}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* PRZYCISK USUWANIA (KOSZ) */}
                    <button
                      onClick={() => props.onDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                      title="Usuń notatkę"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SEKCJA ZADANIA/PAKOWANIE - NOWOŚĆ */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Formularz dodawania */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Co trzeba spakować/zrobić?"
                  className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                />
                <select 
                  className="p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  value={todoCategory}
                  onChange={(e) => setTodoCategory(e.target.value)}
                >
                  <option value="Ubrania">👕 Ubrania</option>
                  <option value="Elektronika">🔌 Elektronika</option>
                  <option value="Dokumenty">📄 Dokumenty</option>
                  <option value="Apteczka">💊 Apteczka</option>
                  <option value="Inne">📦 Inne</option>
                </select>
                <button
                  onClick={handleSaveTodo}
                  disabled={loading || !newTodoText.trim()}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                >
                  Dodaj
                </button>
              </div>
            </div>

            {/* Lista pogrupowana */}
            {Object.keys(groupedTodos).length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed">
                <p className="text-gray-400">Twoja lista pakowania jest pusta.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(groupedTodos).map(([category, items]) => {
                  const completedCount = items.filter(i => i.isCompleted).length;
                  const progress = (completedCount / items.length) * 100;

                  return (
                    <div key={category} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      {/* Nagłówek kategorii z paskiem postępu */}
                      <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                            {category === 'Ubrania' ? '👕' : category === 'Elektronika' ? '🔌' : category === 'Dokumenty' ? '📄' : '📦'} {category}
                          </h3>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                            {completedCount}/{items.length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Przedmioty w kategorii */}
                      <div className="divide-y divide-gray-50">
                        {items.map((todo) => (
                          <div key={todo.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors group">
                            <input
                              type="checkbox"
                              checked={todo.isCompleted}
                              onChange={() => props.onToggleTodo(todo.id, !todo.isCompleted)}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`flex-1 text-sm ${todo.isCompleted ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
                              {todo.content}
                            </span>
                            <button 
                              onClick={() => props.onDeleteTodo(todo.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}