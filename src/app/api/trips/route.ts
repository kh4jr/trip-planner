import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

interface CreateTripBody {
  name?: string;
  title?: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  destination?: string;
  participantIds?: number[];
}

export async function GET() {
  const trips = await db.trip.findMany({
    include: {
      owner: true,
      participants: {
        include: {
          user: true,
        },
      },
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
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId) {
      return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
    }

    const body: CreateTripBody = await req.json();
    const {
      name,
      title,
      description,
      startDate,
      endDate,
      location,
      destination,
      participantIds = [],
    } = body;

    const ownerParticipant = await db.participant.findUnique({
      where: { userId },
    });

    if (!ownerParticipant) {
      return NextResponse.json(
        { error: "Użytkownik nie ma profilu Participant" },
        { status: 400 }
      );
    }

    const otherParticipants = await db.participant.findMany({
      where: {
        userId: {
          in: participantIds.filter((id) => id !== userId),
        },
      },
    });

    const trip = await db.trip.create({
      data: {
        name: name || title || "Nowy wyjazd",
        description: description || "",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location: location || "Brak lokalizacji",
        destination: destination || location || "Brak lokalizacji",
        ownerId: userId,

        participants: {
          connect: [
            { id: ownerParticipant.id },
            ...otherParticipants.map((p) => ({ id: p.id })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        owner: true,
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error("CREATE TRIP ERROR:", error);
    return NextResponse.json(
      { error: "Błąd serwera" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (!userId) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tripId = Number(searchParams.get("tripId"));

  if (!tripId) {
    return NextResponse.json({ error: "Brak tripId" }, { status: 400 });
  }

  const trip = await db.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    return NextResponse.json({ error: "Wyjazd nie istnieje" }, { status: 404 });
  }

  if (trip.ownerId !== userId) {
    return NextResponse.json(
      { error: "Brak uprawnień" },
      { status: 403 }
    );
  }

  await db.trip.delete({
    where: { id: tripId },
  });

  return NextResponse.json({ success: true });
}

