import { db } from "@/lib/db";
import TripManager from "@/components/TripManager";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import {
  Participant,
  Expense,
  TripItem,
  Activity,
  Note,
  TripImage,
  Todo,
} from "@prisma/client";

interface FullTrip {
  id: number;
  name: string;
  title: string;
  description: string;
  location: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  userId: number; // Tutaj musi być number
  participants: Participant[];
  expenses: Expense[];
  items: TripItem[];
  activities: Activity[];
  notes: Note[];
  images: TripImage[];
  todos: Todo[];
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // 1️⃣ KLUCZOWA ZMIANA: Konwersja ID sesji (String) na Number
  const rawUserId = session?.user?.id;
  const userId = rawUserId ? Number(rawUserId) : null;
  const currentUserName = session?.user?.name || "Anonim";

  // 2️⃣ Pobieranie wycieczek
  const allTripsData = await db.trip.findMany({
    include: {
      participants: true,
      expenses: true,
      items: true,
      activities: true,
      notes: true,
      images: true,
    },
    orderBy: { startDate: "asc" },
  });

  // 3️⃣ Pobieranie uczestników
  const allAvailableParticipants = await db.participant.findMany({
    where: {
      userId: { gt: 0 },
    },
    orderBy: { name: "asc" },
  });

  // 4️⃣ Upsert (Naprawione ID)
  if (userId && !isNaN(userId)) {
    try {
      await db.participant.upsert({
        // Wymuszamy typ liczbowy, aby zgadzał się z Int w Prisma
        where: { userId: userId as number }, 
        update: { name: currentUserName },
        create: {
          userId: userId as number,
          name: currentUserName,
          role: "OWNER",
        },
      });
    } catch (e) {
      console.error("Upsert failed, but continuing...", e);
    }
  }

  // 5️⃣ Mapowanie (Dodane zabezpieczenie typów)
  const tripsFromDb: FullTrip[] = allTripsData.map((trip) => ({
    id: trip.id,
    name: trip.name,
    title: trip.name || "",
    description: trip.description || "",
    location: trip.location || "",
    destination: trip.destination || "",
    startDate: new Date(trip.startDate),
    endDate: new Date(trip.endDate),
    userId: Number(trip.userId), // Wymuszamy Number
    participants: trip.participants ?? [],
    expenses: trip.expenses ?? [],
    items: trip.items ?? [],
    activities: trip.activities ?? [],
    notes: trip.notes ?? [],
    images: trip.images ?? [],
    todos: [],
  }));

  // 6️⃣ Filtracja (Teraz oba to Number, więc zadziała)
  const userTrips = tripsFromDb.filter((trip) => {
    const isOwner = userId !== null && trip.userId === userId;
    const isParticipant = trip.participants.some(
      (p) => p.userId === userId
    );
    return isOwner || isParticipant;
  });

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="w-full px-4 md:px-12 py-4">
        <TripManager
          initialTrips={userTrips}
          session={session}
          allAvailablePeople={allAvailableParticipants}
        />
      </div>
      <footer className="p-10 mt-auto">
        <p className="text-blue-500 text-xs font-black uppercase tracking-widest">
          Trip Planner Pro • 2026
        </p>
      </footer>
    </main>
  );
}

export async function addExpense(
  tripId: number,
  data: { description: string; amount: number; paidBy: string }
) {
  try {
    const expense = await db.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        paidBy: data.paidBy,
        tripId,
      },
    });
    revalidatePath("/");
    return expense;
  } catch (error) {
    console.error("Błąd podczas dodawania wydatku:", error);
    throw new Error("Nie udało się zapisać wydatku");
  }
}