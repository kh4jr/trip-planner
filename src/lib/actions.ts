'use server'

import { db } from './db'
import { revalidatePath } from 'next/cache'

export interface TripFormData {
  name: string;
  destination: string;
  location?: string;
  description?: string;
  startDate: string;
  endDate: string;
  participants: {
    name: string;
    email?: string;
    role?: string;
  }[];
}

export async function createTrip(data: TripFormData) {
  try {
    const trip = await db.trip.create({
      data: {
        name: data.name,
        destination: data.destination,
        location: data.location || "",
        description: data.description || "",
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
    console.error("Błąd bazy:", error);
    throw new Error("Nie udało się utworzyć podróży");
  }
}

export async function addExpense(tripId: string, data: { description: string, amount: number, paidBy: string, category: string }) {
  try {
    const expense = await db.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        paidBy: data.paidBy,
        category: data.category,
        tripId: parseInt(tripId), 
      },
    });
    revalidatePath('/'); 
    return expense; 
  } catch (error) {
    throw new Error("Nie udało się zapisać wydatku"); 
  }
}

export async function deleteExpense(expenseId: number) {
  try {
    await db.expense.delete({
      where: { id: expenseId },
    });
    revalidatePath('/');
  } catch (error) {
    console.error("Błąd usuwania wydatku:", error);
    throw new Error("Nie udało się usunąć wydatku");
  }
}

export async function addNote(tripId: string, content: string, author: string) {
  const note = await db.note.create({
    data: { content, author, tripId: parseInt(tripId) },
  });
  revalidatePath('/');
  return note;
}

export async function toggleNote(noteId: number, isCompleted: boolean) {
  await db.note.update({
    where: { id: noteId },
    data: { isCompleted },
  });
  revalidatePath('/');
}

export async function deleteNote(noteId: number) {
  await db.note.delete({ where: { id: noteId } });
  revalidatePath('/');
}

export async function addTodoAction(tripId: number, content: string, category: string) {
  try {
    const todo = await db.todo.create({
      data: {
        content,
        category,
        tripId,
        isCompleted: false,
      },
    });
    revalidatePath('/');
    return todo;
  } catch (error) {
    console.error("Błąd dodawania zadania:", error);
    throw new Error("Nie udało się zapisać zadania");
  }
}

export async function toggleTodoAction(todoId: number, isCompleted: boolean) {
  await db.todo.update({
    where: { id: todoId },
    data: { isCompleted }
  });
  revalidatePath('/');
}

export async function deleteTodoAction(todoId: number) {
  await db.todo.delete({ where: { id: todoId } });
  revalidatePath('/');
}

