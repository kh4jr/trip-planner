import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

interface TripRequestBody {
  name?: string;
  title?: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  destination?: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }

  const trips = await db.trip.findMany({
    where: {
      ownerId: userId,
    },
    include: {
      participants: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(trips);
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = session?.user?.id ? Number(session.user.id) : null;

    if (!sessionUserId || !session?.user?.email) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const body: TripRequestBody = await req.json();
    const { name, title, description, startDate, endDate, location, destination } = body;

    const dbUser = await db.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Użytkownik nie istnieje" }, { status: 404 });
    }

    console.log("DB OBJECT:", Object.keys(db));

    const newTrip = await db.trip.create({
      data: {
        name: name || title || "Nowy wyjazd",
        description: description || "",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location: location || "Brak lokalizacji",
        destination: destination || location || "Brak lokalizacji",
        ownerId: dbUser.id,

        participants: {
          create: [
            {
              name: dbUser.name || "Organizer",
              email: dbUser.email,
              role: "owner",
            },
          ],
        },
      },
      include: {
        participants: true,
      },
    });

    return NextResponse.json(newTrip);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Nieznany błąd serwera";
    console.error("ADD TRIP ERROR:", message);

    return NextResponse.json(
      { error: "Błąd serwera", details: message },
      { status: 500 }
    );
  }
}
