import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { requireTripParticipant } from "@/lib/tripAuth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");
    if (!tripId) return NextResponse.json([]);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }

    const userId = Number(session.user.id);
    await requireTripParticipant(parseInt(tripId), userId);

    const activities = await db.activity.findMany({
      where: { tripId: parseInt(tripId) },
      orderBy: { time: "asc" },
    });

    return NextResponse.json(activities);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Wystąpił błąd" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Próba zapisu aktywności:", body);

    const tripId = parseInt(body.tripId);
    const userId = Number(session.user.id);

    await requireTripParticipant(tripId, userId);

    const trip = await db.trip.findUnique({
      where: { id: tripId },
      select: { startDate: true, endDate: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Brak wyjazdu" }, { status: 404 });
    }

    const activityTime = new Date(body.time);
    if (isNaN(activityTime.getTime())) {
      return NextResponse.json({ error: "Nieprawidłowy format daty" }, { status: 400 });
    }

    if (activityTime < trip.startDate || activityTime > trip.endDate) {
      return NextResponse.json({
        error: "Data aktywności musi mieścić się w przedziale trwania podróży."
      }, { status: 400 });
    }

    const newActivity = await db.activity.create({
      data: {
        name: body.name,
        time: activityTime,
        tripId,
        createdByName: session.user.name ?? session.user.email ?? "Użytkownik",
      },
    });

    return NextResponse.json(newActivity);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";

    console.error("BŁĄD PRISMA:", errorMessage);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
    }

    const activity = await db.activity.findUnique({
      where: { id: Number(id) },
      select: { tripId: true },
    });

    if (!activity) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const userId = Number(session.user.id);
    await requireTripParticipant(activity.tripId, userId);

    await db.activity.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    console.error("BŁĄD DELETE ACTIVITY:", error);
    return NextResponse.json(
      { error: "Nie udało się usunąć aktywności" },
      { status: 500 }
    );
  }
}

