"use client";
import { useState, useMemo } from 'react';
import { Expense, Participant } from '@/lib/data';

interface BudgetModuleProps {
    tripId: number;
    expenses: Expense[];
    participants: Participant[];
    onAddExpense: (expense: Expense) => void;
    participantsMap: Map<string, Participant>;
}

// Funkcja obliczająca bilans (kluczowa dla budżetowania)
const calculateBalance = (expenses: Expense[], participants: Participant[]) => {
    const balance = new Map<string, number>(); // Map<ParticipantId, Kwota>
    participants.forEach(p => balance.set(p.id, 0));

    expenses.forEach(expense => {
        const payerId = expense.paidById;
        const splitCount = expense.splitBy.length;
        if (splitCount === 0) return;

        const individualShare = expense.amount / splitCount;

        // 1. Zwiększ saldo płacącego
        balance.set(payerId, (balance.get(payerId) || 0) + expense.amount);

        // 2. Zmniejsz saldo każdej osoby o jej część
        expense.splitBy.forEach(debtorId => {
            balance.set(debtorId, (balance.get(debtorId) || 0) - individualShare);
        });
    });

    return balance;
};

export default function BudgetModule({ expenses, participants, participantsMap, onAddExpense }: BudgetModuleProps) {
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    
    // Obliczanie bilansu za pomocą useMemo (optymalizacja)
    const currentBalance = useMemo(() => calculateBalance(expenses, participants), [expenses, participants]);

    // W przyszłości: Utwórz tu ExpenseForm.tsx i użyj go zamiast przycisku

    return (
        <div>
            {/* 1. SEKCJA WYDATKÓW */}
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Lista Wydatków</h3>
            <div className="space-y-3">
                {expenses.map(exp => (
                    <div key={exp.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                        <div>
                            <span className="font-medium text-gray-900">{exp.description}</span>
                            <div className="text-sm text-gray-500">
                                Zapłacił: {participantsMap.get(exp.paidById)?.name || 'Nieznany'}
                            </div>
                        </div>
                        <div className="font-bold text-lg text-red-600">
                            {exp.amount.toFixed(2)} zł
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={() => alert("W przyszłości otworzę formularz dodawania wydatku!") /* setIsAddingExpense(true) */}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
                + Dodaj Wydatek
            </button>
            
            {/* 2. SEKCJA BILANSU */}
            <h3 className="text-xl font-semibold mt-8 mb-4 border-t pt-4 text-gray-700">Kto Komu Jest Winien? (Bilans)</h3>
            
            <div className="space-y-2">
                {Array.from(currentBalance).map(([id, amount]) => {
                    const participantName = participantsMap.get(id)?.name || 'Nieznany';
                    const isPositive = amount > 0.01;
                    const isZero = Math.abs(amount) < 0.01;

                    return (
                        <div key={id} className={`p-3 rounded-lg ${isPositive ? 'bg-green-50' : isZero ? 'bg-gray-100' : 'bg-red-50'}`}>
                            {participantName}: 
                            {isZero ? (
                                <span className="ml-2 font-semibold text-gray-500">Rozliczony</span>
                            ) : isPositive ? (
                                <span className="ml-2 font-bold text-green-700">Powinien odzyskać {amount.toFixed(2)} zł</span>
                            ) : (
                                <span className="ml-2 font-bold text-red-700">Musi oddać {Math.abs(amount).toFixed(2)} zł</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}