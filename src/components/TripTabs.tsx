'use client';

import { useState } from "react";
import { addExpense, addNote } from "@/lib/actions";
import { Activity, Expense, Note, TripItem } from "@prisma/client";
import { ChevronDown } from "lucide-react";
import { FullTrip } from "@/types/fullTrip";
import { useEffect } from "react";
import { errorAlert, successAlert } from "@/lib/alert";

interface ExpenseStat {
  name: string;
  value: number;
}

interface TripTabsProps {
  trip: FullTrip;

  userName: string;

  activities: Activity[];
  expenses: Expense[];
  notes: Note[];
  todos: TripItem[];

  isReadOnly: boolean;

  onDeleteTrip: (id: number) => void;

  onAddActivity: (activity: Activity) => void;
  onDeleteActivity: (id: number) => Promise<void>;

  onAddExpense: (expense: Expense) => void;
  onRemoveExpense: (id: number) => void;

  onAddNote: (note: Note) => void;
  onToggleNote: (noteId: number, completed: boolean) => void;
  onDeleteNote: (id: number) => void;

  onAddTodo: (content: string, category: string) => Promise<void>;
  onToggleTodo: (id: number, completed: boolean) => void;
  onDeleteTodo: (id: number) => void;
}


const TABS = [
  { id: 'plan', label: 'Plan Podróży' },
  { id: 'budget', label: 'Budżet ' },
  { id: 'tasks', label: 'Zadania' },
  //{ id: 'photos', label: 'Zdjęcia 📸' },
  { id: 'notes', label: 'Notatki ' },
];

const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Jedzenie', icon: '🍔' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'stay', label: 'Nocleg', icon: '🏨' },
  { id: 'fun', label: 'Atrakcje', icon: '🎡' },
  { id: 'other', label: 'Inne', icon: '📦' },
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
  const [expenseCategory, setExpenseCategory] = useState('food');
  const [isListOpen, setIsListOpen] = useState(false)
  const [alert, setAlert] = useState<{
  type: "error" | "success";
  message: string;
} | null>(null);

  useEffect(() => {
    if (!alert) return;

    const timer = setTimeout(() => {
      setAlert(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [alert]);


  const participants = (props.trip.participants || []).map(p => ({
  id: p.id,
  role: p.role,
  name: p.user.name ?? p.user.email, 
  email: p.user.email,
}));
  const currentExpenses = props.expenses || [];
  const total = currentExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const participantCount = participants.length > 0 ? participants.length : 1;
  const perPerson = total / participantCount;

  const stats = currentExpenses.reduce((acc: ExpenseStat[], exp) => {
    const existing = acc.find(s => s.name === exp.category);
    if (existing) {
      existing.value += Number(exp.amount);
    } else {
      acc.push({ name: exp.category, value: Number(exp.amount) });
    }
    return acc;
  }, []).map(stat => ({
    name: stat.name,
    percentage: total > 0 ? Math.round((stat.value / total) * 100) : 0
  }));

  const safeTodos = Array.isArray(props.todos) ? props.todos : [];

  const groupedTodos: Record<string, typeof safeTodos> = {
    Wszystkie: safeTodos,
  };

  const handleSaveActivity = async () => {
    if (!newActivityName || !newActivityTime) return;

    setLoading(true);
    setAlert(null);

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newActivityName,
          time: newActivityTime,
          tripId: props.trip.id,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setAlert(errorAlert("Musisz być zalogowany, aby dodać aktywność."));
          return;
        }

        if (res.status === 403) {
          setAlert(errorAlert("Nie jesteś uczestnikiem tej podróży."));
          return;
        }

        setAlert(errorAlert("Wystąpił błąd podczas zapisu aktywności."));
          return;
      }

      const saved = await res.json();
      props.onAddActivity(saved);

      setIsAddingActivity(false);
      setNewActivityName("");
      setNewActivityTime("");
      } catch (error) {
        console.error(error);
        setAlert({
          type: "error",
          message: "Wystąpił błąd podczas zapisu aktywności.",
        });
      } finally {
        setLoading(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!expenseDesc || !expenseAmount || !paidBy) return;

    setLoading(true);
    setAlert(null);

    try {
      const saved = await addExpense(props.trip.id, {
        description: expenseDesc,
        amount: parseFloat(expenseAmount),
        paidBy: paidBy,
        category: expenseCategory,
      });

      props.onAddExpense(saved);

      setAlert(successAlert("Wydatek został dodany."));

      setExpenseDesc("");
      setExpenseAmount("");
      setPaidBy("");
      setIsAddingExpense(false);
    } catch (error) {
      console.error(error);
      setAlert(errorAlert("Nie udało się dodać wydatku."));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteText.trim()) return;

    setLoading(true);
    setAlert(null);

    try {
      const saved = await addNote(
        props.trip.id,
        newNoteText
      );

      props.onAddNote(saved);
      setNewNoteText("");

      setAlert(successAlert("Notatka została dodana."));
    } catch (error) {
      console.error(error);
      setAlert(errorAlert("Nie udało się dodać notatki."));
    } finally {
      setLoading(false);
    }
  };


  const handleSaveTodo = async () => {
    if (!newTodoText.trim()) return;

    setLoading(true);
    setAlert(null);

    try {
      await props.onAddTodo(newTodoText, todoCategory);

      setAlert(successAlert("Zadanie zostało dodane."));
      setNewTodoText("");
    } catch (error) {
      console.error(error);
      setAlert(errorAlert("Nie udało się dodać zadania."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    setLoading(true);
    setAlert(null);

    try {
      await props.onDeleteActivity(id);
      setAlert(successAlert("Aktywność została usunięta."));
    } catch (error) {
      console.error(error);
      setAlert(errorAlert("Nie udało się usunąć aktywności."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    setLoading(true);
    setAlert(null);

    try {
      await props.onRemoveExpense(id);
      setAlert(successAlert("Wydatek został usunięty."));
    } catch (error) {
      console.error(error);
      setAlert(errorAlert("Nie udało się usunąć wydatku."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    setLoading(true);
    setAlert(null);

    try {
      await props.onDeleteNote(id);
      setAlert(successAlert("Notatka została usunięta."));
    } catch (error) {
      console.error(error);
      setAlert(errorAlert("Nie udało się usunąć notatki."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    setLoading(true);
    setAlert(null);

    try {
      await props.onDeleteTodo(id);
      setAlert(successAlert("Zadanie zostało usunięte."));
    } catch (error) {
      console.error(error);
      setAlert(errorAlert("Nie udało się usunąć zadania."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrip = async () => {
    setLoading(true);
    setAlert(null);

    try {
      props.onDeleteTrip(props.trip.id);
      setAlert(successAlert("Wyjazd został usunięty."));
    } catch (error) {
      console.error(error);
      setAlert(errorAlert("Nie udało się usunąć wyjazdu."));
    } finally {
      setLoading(false);
    }
  };


  const settlement: { from: string; to: string; amount: number }[] = [];
  const balances = participants.map(p => {
    const paid = currentExpenses.filter(e => e.paidBy === p.name).reduce((s, e) => s + Number(e.amount), 0);
    return { name: p.name, balance: paid - perPerson };
  });

  const debtors = balances.filter(b => b.balance < -0.01).map(d => ({...d, bal: Math.abs(d.balance)})).sort((a,b) => b.bal - a.bal);
  const creditors = balances.filter(b => b.balance > 0.01).map(c => ({...c, bal: c.balance})).sort((a,b) => b.bal - a.bal);

  let dIdx = 0, cIdx = 0;
  while(dIdx < debtors.length && cIdx < creditors.length) {
    const amount = Math.min(debtors[dIdx].bal, creditors[cIdx].bal);
    if (amount > 0.1) settlement.push({ from: debtors[dIdx].name, to: creditors[cIdx].name, amount });
    debtors[dIdx].bal -= amount; creditors[cIdx].bal -= amount;
    if (debtors[dIdx].bal <= 0.1) dIdx++;
    if (creditors[cIdx].bal <= 0.1) cIdx++;
  }

  return (
    <div className="w-full space-y-6 bg-white p-4 md:p-10 rounded-[2.5rem] shadow-2xl shadow-blue-50/50 border border-blue-50">
      
      {/* header */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-blue-50 pb-8 gap-6">
        <div className="space-y-3">
    <h2 className="text-4xl md:text-5xl font-black !text-blue-900 tracking-tighter leading-tight">
      {props.trip.name}
    </h2>
    <div className="flex flex-wrap items-center gap-4">
      <p className="text-lg !text-blue-600 font-black bg-blue-50 px-5 py-2 rounded-2xl">
        📍 {props.trip.location || props.trip.destination || "Brak lokalizacji"}
      </p>
      
      <div className="relative flex items-center">
        <div className="flex -space-x-3">
          {participants.length > 0 ? (
            participants.map((p) => (
              <div 
                key={p.id} 
                title={p.name}
                className="relative w-12 h-12 rounded-full bg-blue-600 border-4 border-white flex items-center justify-center text-xs text-white font-black shadow-lg uppercase"
              >
                { }
                {p.role === "OWNER" && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xl drop-shadow-md">👑</span>
                )}
                {p.name.charAt(0).toUpperCase()}
              </div>
            ))
          ) : (
            <span className="text-xs !text-slate-400 italic bg-slate-50 px-3 py-2 rounded-lg">Brak uczestników</span>
          )}
        </div>

        { }
        {participants.length > 0 && (
          <button 
            onClick={() => setIsListOpen(!isListOpen)}
            className="ml-3 p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all shadow-sm"
          >
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isListOpen ? 'rotate-180' : ''}`} />
          </button>
        )}

        { }
        {isListOpen && (
          <div className="absolute top-full left-0 mt-3 w-56 bg-white border-2 border-blue-50 rounded-2xl shadow-2xl z-[100] p-3 animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-black text-blue-300 uppercase px-2 mb-2 tracking-widest">Lista uczestników</p>
            <div className="space-y-1">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 rounded-xl transition-colors">
                  <span className="text-sm font-bold text-blue-900">{p.name}</span>
                  {p.role === "OWNER" && (
                    <span className="text-[9px] font-black bg-yellow-400 text-white px-2 py-0.5 rounded-full uppercase">Szef</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>  
        <button
          onClick={handleDeleteTrip}
          className="
            px-4 py-2
            rounded-xl
            bg-red-600 text-white
            text-xs font-black
            hover:bg-red-700
            transition
            shadow-md
          "
        >
          Usuń wyjazd
        </button>


      </div>

      { }
      <div className="flex space-x-2 bg-blue-50/30 p-2 rounded-3xl w-fit border border-blue-50/50 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-8 text-sm font-black rounded-2xl transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white !text-blue-600 shadow-xl ring-1 ring-blue-50' 
                : '!text-blue-400 hover:!text-blue-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {alert && (
          <div
            className={`p-4 rounded-xl text-sm font-bold ${
              alert.type === "error"
                ? "bg-red-50 text-red-600 border border-red-100"
                : "bg-green-50 text-green-600 border border-green-100"
            }`}
          >
            {alert.message}
          </div>
        )}

      { }
      <div className="mt-6 w-full lg:min-h-[500px]">
        
        { }
        {activeTab === 'plan' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center">
              <h3 className="text-3xl font-black !text-blue-900">Harmonogram</h3>
              <span className="bg-blue-600 text-white px-5 py-2 rounded-full font-black text-xs">
                {props.activities?.length || 0} Aktywności
              </span>
            </div>

            {isAddingActivity ? (
              <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-100 space-y-4">
                <input 
                  placeholder="Co planujesz?" 
                  className="w-full p-4 bg-white border border-blue-50 rounded-xl outline-none font-bold !text-slate-900 placeholder:!text-slate-400" 
                  value={newActivityName} 
                  onChange={(e) => setNewActivityName(e.target.value)} 
                />
                <input 
                  type="datetime-local" 
                  className="w-full-1/2 p-4 bg-white border border-blue-300 rounded-xl outline-none font-bold !text-slate-900"
                  value={newActivityTime} 
                  onChange={(e) => setNewActivityTime(e.target.value)} 
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveActivity} disabled={loading} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg">Zapisz</button>
                  <button onClick={() => setIsAddingActivity(false)} className="px-6 bg-gray-100 !text-slate-600 rounded-xl font-bold">Anuluj</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingActivity(true)} className="w-full py-10 border-4 border-dashed border-blue-50 rounded-[2.5rem] !text-slate-300 hover:!text-blue-500 font-black text-xl transition-all">
                + Zaplanuj nową przygodę
              </button>
            )}

            <div className="grid gap-4">
              {props.activities?.map((act) => (
                <div key={act.id} className="flex items-center gap-6 bg-white p-6 rounded-[2rem] border border-blue-50 shadow-sm group">
                  <div className="bg-blue-600 text-white px-4 py-3 rounded-xl font-black text-xs shrink-0">
                    {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <h4 className="flex-1 font-black !text-blue-900 text-lg text-left">{act.name}</h4>
                  <button onClick={() => handleDeleteActivity(act.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:scale-125 transition-all">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        { }
        {activeTab === 'budget' && (
          <div className="space-y-10 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl text-left">
                <p className="!text-slate-400 font-black uppercase text-[10px] mb-2">Łączne wydatki</p>
                <p className="text-4xl font-black !text-blue-900 tracking-tighter">{total.toFixed(2)} zł</p>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-xl text-left">
                <p className="!text-slate-400 font-black uppercase text-[10px] mb-2">Udział na osobę</p>
                <p className="text-4xl font-black !text-blue-600 tracking-tighter">{perPerson.toFixed(2)} zł</p>
                <p className="text-xs font-bold !text-blue-300 mt-4">Przy {participantCount} uczestnikach</p>
              </div>
              
              <div className="bg-blue-900 p-8 rounded-[2.5rem] text-white text-left">
                <p className="text-blue-300 font-black uppercase text-[10px] mb-6">Struktura kosztów 📊</p>
                <div className="space-y-4">
                  {stats.length > 0 ? stats.map((stat) => (
                    <div key={stat.name} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-black uppercase">
                        <span className="truncate mr-2">{EXPENSE_CATEGORIES.find(c => c.id === stat.name)?.label || stat.name}</span>
                        <span>{stat.percentage}%</span>
                      </div>
                      <div className="w-full bg-blue-800/50 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-400 h-full rounded-full" style={{ width: `${stat.percentage}%` }} />
                      </div>
                    </div>
                  )) : <p className="text-xs italic text-blue-400">Brak wydatków</p>}
                </div>
              </div>
              <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl">
                <p className="text-blue-100 font-black uppercase text-[10px] mb-4 text-left">Rozliczenia 🤝</p>
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar text-left">
                  {settlement.length > 0 ? settlement.map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px] font-bold bg-white/10 p-2.5 rounded-xl border border-white/10">
                      <span className="truncate mr-1 text-white">{s.from} ➡️ {s.to}</span>
                      <span className="text-white bg-blue-800 px-2 py-1 rounded-lg shrink-0">{s.amount.toFixed(2)} zł</span>
                    </div>
                  )) : <p className="text-blue-100 text-xs font-bold italic opacity-70 text-center py-4">Wszystko rozliczone!</p>}
                </div>
              </div>
            </div>

            {isAddingExpense ? (
              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-blue-600 shadow-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    placeholder="Za co?" 
                    className="w-full p-5 border-2 border-blue-50 rounded-2xl outline-none !text-slate-900 font-bold placeholder:!text-slate-400 bg-white" 
                    value={expenseDesc} 
                    onChange={(e) => setExpenseDesc(e.target.value)} 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="number" 
                      placeholder="Kwota" 
                      className="w-full p-5 border-2 border-blue-50 rounded-2xl outline-none !text-slate-900 font-bold placeholder:!text-slate-400 bg-white" 
                      value={expenseAmount} 
                      onChange={(e) => setExpenseAmount(e.target.value)} 
                    />
                    <select 
                      className="w-full p-5 border-2 border-blue-50 rounded-2xl bg-white outline-none !text-slate-900 font-black" 
                      value={paidBy} 
                      onChange={(e) => setPaidBy(e.target.value)}
                    >
                      <option value="" className="!text-slate-400">Płatnik</option>
                      {participants.map(p => <option key={p.id} value={p.name} className="!text-slate-900">{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setExpenseCategory(cat.id)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${expenseCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-blue-50 !text-blue-600'}`}>
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSaveExpense} disabled={loading} className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl">Zapisz wydatek</button>
                  <button onClick={() => setIsAddingExpense(false)} className="px-10 bg-slate-100 !text-slate-600 rounded-2xl font-bold">Anuluj</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddingExpense(true)} className="w-full py-8 bg-blue-900 text-white font-black rounded-[2rem] text-xl shadow-lg">
                + Zapisz nowy wydatek
              </button>
            )}

            <div className="space-y-4">
              {currentExpenses.map(exp => (
                <div key={exp.id} className="group flex justify-between items-center bg-white p-6 rounded-2xl border border-blue-50 shadow-sm hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleDeleteExpense(exp.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 transition-all">🗑️</button>
                    <div className="text-left">
                      <p className="font-black !text-blue-900 text-lg">{exp.description}</p>
                      <p className="text-[10px] font-bold !text-blue-400 uppercase">
                        Płatnik: {exp.paidBy} • {EXPENSE_CATEGORIES.find(c => c.id === exp.category)?.label || exp.category}
                      </p>
                    </div>
                  </div>
                  <p className="font-black !text-blue-600 text-2xl shrink-0">{Number(exp.amount).toFixed(2)} zł</p>
                </div>
              ))}
            </div>
          </div>
        )}

        { }
        {activeTab === 'notes' && (
          <div className="space-y-8 animate-in fade-in w-full">
            <div className="flex gap-4 bg-blue-50/30 p-3 rounded-[2rem] border border-blue-50 w-full">
              <input 
                placeholder="Wpisz treść notatki..." 
                className="flex-1 p-5 bg-white rounded-[1.5rem] outline-none font-bold !text-slate-900 placeholder:!text-slate-400 border border-blue-50" 
                value={newNoteText} 
                onChange={(e) => setNewNoteText(e.target.value)} 
              />
              <button onClick={handleSaveNote} disabled={loading || !newNoteText.trim()} className="px-12 bg-blue-600 text-white font-black rounded-[1.5rem]">Dodaj</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {props.notes?.map((note) => (
                <div key={note.id} className={`p-8 rounded-[2rem] border-2 transition-all group ${note.isCompleted ? "bg-blue-50/10 border-transparent opacity-60" : "bg-white border-blue-50 shadow-sm"}`}>
                  <div className="flex items-start gap-4 h-full flex-col">
                    <div className="flex items-center gap-4 w-full">
                      <input type="checkbox" checked={note.isCompleted} onChange={() => props.onToggleNote(note.id, !note.isCompleted)} className="w-6 h-6 rounded-lg cursor-pointer shrink-0" />
                      <p className={`!text-blue-900 font-bold text-lg text-left flex-1 ${note.isCompleted ? "line-through !text-slate-400" : ""}`}>{note.content}</p>
                    </div>
                    <div className="w-full mt-auto pt-4 border-t border-blue-50/50 flex justify-between items-center text-[10px] font-black uppercase !text-slate-400">
                      <span 
                          className="truncate">{new Date(note.createdAt).toLocaleDateString()} • autor: organizator
                      </span>
                      <button onClick={() => handleDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:scale-110">Usuń</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        { }
        {activeTab === 'tasks' && (
          <div className="space-y-10 animate-in fade-in w-full">
            <div className="bg-white p-10 rounded-[3rem] border border-blue-100 shadow-2xl">
              <h3 className="text-2xl font-black !text-blue-900 mb-8 flex items-center gap-3 text-left"><span>📦</span> Lista pakowania</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  placeholder="Co spakować?" 
                  className="flex-1 p-5 rounded-2xl bg-white border border-blue-50 outline-none font-bold !text-slate-900 placeholder:!text-slate-400" 
                  value={newTodoText} 
                  onChange={(e) => setNewTodoText(e.target.value)} 
                />
                <select 
                  className="p-5 rounded-2xl bg-white border border-blue-50 outline-none font-black !text-blue-900" 
                  value={todoCategory} 
                  onChange={(e) => setTodoCategory(e.target.value)}
                >
                  <option value="Ubrania" className="!text-slate-900">👕 Ubrania</option>
                  <option value="Elektronika" className="!text-slate-900">🔌 Elektronika</option>
                  <option value="Dokumenty" className="!text-slate-900">📄 Dokumenty</option>
                  <option value="Inne" className="!text-slate-900">📦 Inne</option>
                </select>
                <button onClick={handleSaveTodo} disabled={loading || !newTodoText.trim()} className="px-12 py-5 bg-blue-600 text-white font-black rounded-2xl">Dodaj</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              {Object.entries(groupedTodos).map(([category, items]) => {
                const completedCount = items.filter(i => i.isCompleted).length;
                const progress = (completedCount / items.length) * 100;
                return (
                  <div key={category} className="bg-white rounded-[2.5rem] border border-blue-100 shadow-xl overflow-hidden flex flex-col h-full">
                    <div className="p-8 bg-blue-50/20 text-left">
                      <div className="flex justify-between items-center mb-6 font-black !text-blue-900 uppercase">
                        <h3>🔹 {category}</h3>
                        <span className="text-xs bg-white !text-slate-600 px-4 py-2 rounded-full">{completedCount} / {items.length}</span>
                      </div>
                      <div className="w-full bg-white h-3 rounded-full border border-blue-50 p-0.5">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    <div className="p-4 divide-y divide-blue-50/50 flex-1">
                      {items.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-center gap-5 p-5 hover:bg-blue-50/30 rounded-2xl group transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={todo.isCompleted}
                            onChange={() =>
                              props.onToggleTodo(todo.id, !todo.isCompleted)
                            }
                            className="w-7 h-7 rounded-xl cursor-pointer shrink-0"
                          />
                          <span
                            className={`flex-1 font-bold text-left ${
                              todo.isCompleted
                                ? "line-through !text-slate-300"
                                : "!text-blue-900"
                            }`}
                          >
                            {todo.name}
                          </span>
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:rotate-12 transition-all"
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
          </div>
        )}
      </div>
    </div>
  );
}