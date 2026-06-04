import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { requireTripParticipant } from "@/lib/tripAuth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get("tripId");
  if (!tripId) return NextResponse.json([]);

  const activities = await db.activity.findMany({
    where: { tripId: parseInt(tripId) },
    orderBy: { time: "asc" },
  });

  return NextResponse.json(activities);
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

    const newActivity = await db.activity.create({
      data: {
        name: body.name,
        time: new Date(body.time),
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
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
    }

    await db.activity.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BŁĄD DELETE ACTIVITY:", error);
    return NextResponse.json(
      { error: "Nie udało się usunąć aktywności" },
      { status: 500 }
    );
  }
}

