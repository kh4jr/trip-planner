import { prisma } from "@/lib/db";
import TripManager from "@/components/TripManager";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { revalidatePath } from 'next/cache';

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  let tripsFromDb = [];

  try {
    if (session?.user?.email) {
      // Pobieramy wyjazdy zalogowanego użytkownika wraz z relacjami
      const data = await prisma.trip.findMany({
        where: {
          user: { email: session.user.email }
        },
        include: { 
          participants: true, 
          expenses: true,
          items: true,      
        },
        orderBy: { startDate: 'asc' },
      });
      
      // JSON.parse(JSON.stringify()) jest potrzebne w Next.js, 
      // aby uniknąć błędów z datami przesyłanymi do komponentów Client
      tripsFromDb = JSON.parse(JSON.stringify(data));
    }
  } catch (error) {
    console.error("Błąd bazy danych Prisma:", error);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <TripManager initialTrips={tripsFromDb} />
    </main>
  );
}

export async function addExpense(tripId: number, data: { description: string, amount: number, paidBy: string }) {
  try {
    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        paidBy: data.paidBy,
        tripId: tripId, // Łączymy wydatek z Warszawą (ID 3)
      },
    });

    revalidatePath('/'); // To odświeży listę wydatków i sumę pieniędzy
    return expense;
  } catch (error) {
    console.error("Błąd podczas dodawania wydatku:", error);
    throw new Error("Nie udało się zapisać wydatku");
  }
}