import { prisma } from "@/lib/db";
import TripManager from "@/components/TripManager";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  let tripsFromDb = [];

  try {
    if (session?.user?.email) {
      // Pobieramy tylko wyjazdy zalogowanego użytkownika
      const data = await prisma.trip.findMany({
        where: {
          user: { email: session.user.email }
        },
        include: { participants: true },
        orderBy: { startDate: 'asc' },
      });
      tripsFromDb = JSON.parse(JSON.stringify(data));
    }
  } catch (error) {
    console.error("Błąd bazy:", error);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <TripManager initialTrips={tripsFromDb} />
    </main>
  );
}