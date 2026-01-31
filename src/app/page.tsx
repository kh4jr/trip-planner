import { db } from "@/lib/db";
import TripManager from "@/components/TripManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

//import { revalidatePath } from "next/cache";
import { FullTrip } from "@/types/fullTrip";


export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  console.log("SESSION:", session);
  console.log("SESSION USER:", session?.user);
  console.log("SESSION USER ID:", session?.user?.id);

  const rawUserId = session?.user?.id;
  const userId = rawUserId ? Number(rawUserId) : null;

  const allTripsData = await db.trip.findMany({
  include: {
    participants: true,
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
  orderBy: { name: "asc" },
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
  createdAt: trip.createdAt, // ← TO JEST TEN JEBANY BRAKUJĄCY ELEMENT
  participants: trip.participants ?? [],
  expenses: trip.expenses ?? [],
  items: trip.items ?? [],
  activities: trip.activities ?? [],
  notes: trip.notes ?? [],
  images: trip.images ?? [],
  todos: [],
}));



  // 6️⃣ Filtracja (owner + participant)
  const userTrips = tripsFromDb.filter((trip) => {
    const isOwner = userId !== null && trip.ownerId === userId;
    const isParticipant = trip.participants.some(
      (p) => p.email === session?.user?.email
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
