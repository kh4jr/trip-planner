// src/lib/actions.ts
'use server'

import { prisma } from './db'
import { revalidatePath } from 'next/cache'
import { TripFormData } from './data'
import { Expense } from '@prisma/client'

export async function createTrip(data: TripFormData) {
  try {
    const trip = await prisma.trip.create({
      data: {
        name: data.name,
        destination: data.destination,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        participants: {
          create: data.participants.map((p) => ({
            name: p.name,
            email: p.email || '',
            role: p.role || 'member'
          }))
        }
      }
    })
    revalidatePath('/')
    return trip;
  } catch (error) {
    console.error("Szczegółowy błąd bazy:", error);
    throw new Error("Nie udało się zapisać w PostgreSQL");
  }
}

export async function addExpense(
  tripId: number, 
  data: { description: string, amount: number, paidBy: string }
): Promise<Expense> { // FIX: Gwarantujemy, że funkcja zwróci Expense, a nie 'void'
  try {
    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        paidBy: data.paidBy,
        tripId: tripId,
      },
    });

    // Odświeżamy cache
    revalidatePath('/'); 
    revalidatePath(`/trips/${tripId}`); 
    
    return expense; // Zwracamy obiekt, który właśnie trafił do bazy
  } catch (error) {
    console.error("Błąd zapisu:", error);
    // Ważne: rzucamy błąd, żeby TS wiedział, że Promise nie "zawiśnie" na undefined
    throw new Error("Nie udało się zapisać wydatku"); 
  }
}

export async function addNote(tripId: number, content: string, author: string) {
  const note = await prisma.note.create({
    data: {
      content,
      author,
      tripId,
    },
  });
  revalidatePath('/');
  return note;
}

export async function toggleNote(noteId: number, isCompleted: boolean, userName: string) {
  const note = await prisma.note.update({
    where: { id: noteId },
    data: {
      isCompleted,
      completedBy: isCompleted ? userName : null,
    },
  });
  revalidatePath('/');
  return note;
}