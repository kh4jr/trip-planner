"use client";
import { useState, useMemo } from 'react';
import { Expense, Participant } from '@/lib/data';

interface BudgetModuleProps {
    tripId: number;
    expenses: Expense[];
    participants: Participant[];
    onAddExpense: (expense: Expense) => void;
    participantsMap: Map<number, Participant>; // Zmiana string na number
}

const calculateBalance = (expenses: Expense[], participants: Participant[]) => {
    const balance = new Map<number, number>(); // ID to number
    participants.forEach(p => balance.set(p.id, 0));

    expenses.forEach(expense => {
        // W bazie mamy 'amount' (Float/Int). Upewniamy się, że payerId to number
        const payerId = Number(expense.paidBy); // Dopasowanie do pola z lib/data.ts
        const individualShare = expense.amount / (participants.length || 1);

        balance.set(payerId, (balance.get(payerId) || 0) + expense.amount);

        participants.forEach(p => {
            balance.set(p.id, (balance.get(p.id) || 0) - individualShare);
        });
    });

    return balance;
};

export default function BudgetModule({ expenses, participants, participantsMap, onAddExpense, tripId }: BudgetModuleProps) {
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    // Stan początkowy dla selecta (ID to number)
    const [paidBy, setPaidBy] = useState<number>(participants[0]?.id || 0);

    const currentBalance = useMemo(() => calculateBalance(expenses, participants), [expenses, participants]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc || !amount || parseFloat(amount) <= 0) return;

        const newExpense: Expense = {
            id: Date.now(),
            description: desc,
            amount: parseFloat(amount),
            paidBy: String(paidBy), // Przechowujemy jako string w danych, ale ID to number
            date: new Date().toISOString().split('T')[0],
            tripId: tripId, 
            category: "General"
        };

        onAddExpense(newExpense);
        setDesc('');
        setAmount('');
        setIsAddingExpense(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Lista Wydatków</h3>
                <div className="space-y-3">
                    {expenses.map(exp => (
                        <div key={exp.id} className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-center border-l-4 border-l-blue-500">
                            <div>
                                <span className="font-bold text-gray-900 block">{exp.description}</span>
                                <div className="text-sm text-gray-500">
                                    Zapłacił: <span className="font-medium text-gray-700">{participantsMap.get(Number(exp.paidBy))?.name || 'Nieznany'}</span>
                                </div>
                            </div>
                            <div className="font-bold text-lg text-blue-600">
                                {exp.amount.toFixed(2)} zł
                            </div>
                        </div>
                    ))}
                </div>

                {isAddingExpense ? (
                    <form onSubmit={handleSubmit} className="mt-4 p-4 border-2 border-blue-100 rounded-xl bg-blue-50 space-y-4 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="text" 
                                placeholder="Co kupiłeś?" 
                                className="p-2 border rounded-md"
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                required
                            />
                            <input 
                                type="number" 
                                step="0.01"
                                placeholder="Kwota (zł)" 
                                className="p-2 border rounded-md"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-600">Kto płacił?</label>
                            <select 
                                className="p-2 border rounded-md flex-1"
                                value={paidBy}
                                onChange={(e) => setPaidBy(Number(e.target.value))}
                            >
                                {participants.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-md">Dodaj</button>
                            <button type="button" onClick={() => setIsAddingExpense(false)} className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 rounded-md">Anuluj</button>
                        </div>
                    </form>
                ) : (
                    <button onClick={() => setIsAddingExpense(true)} className="mt-4 bg-blue-500 text-white font-bold py-2 px-6 rounded-lg shadow-md">
                        + Dodaj Wydatek
                    </button>
                )}
            </div>

            <div className="pt-6 border-t">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Bilans</h3>
                <div className="grid gap-3">
                    {Array.from(currentBalance).map(([id, amount]) => {
                        const participantName = participantsMap.get(id)?.name || 'Nieznany';
                        const isPositive = amount > 0.01;
                        const isZero = Math.abs(amount) < 0.01;

                        return (
                            <div key={id} className={`p-4 rounded-xl flex justify-between items-center ${isPositive ? 'bg-green-50' : isZero ? 'bg-gray-50' : 'bg-red-50'}`}>
                                <span className="font-medium text-gray-800">{participantName}</span>
                                <span className={`font-bold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                                    {isZero ? 'Rozliczony' : `${isPositive ? 'Odzyska' : 'Odda'} ${Math.abs(amount).toFixed(2)} zł`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}