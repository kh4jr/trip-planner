import { db } from "@/lib/db";
import TripManager from "@/components/TripManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { FullTrip } from "@/types/fullTrip";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  const rawUserId = session?.user?.id;
  const userId = rawUserId ? Number(rawUserId) : null;

  const allTripsData = await db.trip.findMany({
    include: {
      participants: {
        include: {
          user: true,
        },
      },
      expenses: true,
      notes: true,
      activities: true,
      items: true,
      images: true,
      owner: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });

  const allAvailableParticipants = await db.participant.findMany({
    include: {
      user: true,
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  const tripsFromDb: FullTrip[] = allTripsData.map((trip) => ({
    id: trip.id,
    name: trip.name,
    description: trip.description,
    location: trip.location,
    destination: trip.destination,
    startDate: new Date(trip.startDate),
    endDate: new Date(trip.endDate),
    ownerId: trip.ownerId,
    createdAt: trip.createdAt,

    participants: trip.participants ?? [],
    expenses: trip.expenses ?? [],
    items: trip.items ?? [],
    activities: trip.activities ?? [],
    notes: trip.notes ?? [],
    images: trip.images ?? [],
    todos: [],
  }));

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="w-full px-4 md:px-12 py-4">
        <TripManager
          initialTrips={tripsFromDb}
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
