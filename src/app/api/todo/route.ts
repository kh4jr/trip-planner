import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { requireTripParticipant } from "@/lib/tripAuth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "Brak tripId" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }
    const userId = Number(session.user.id);
    await requireTripParticipant(Number(tripId), userId);

    const todos = await db.tripItem.findMany({
      where: { tripId: Number(tripId) },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(todos);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Błąd pobierania zadań" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }

    const body = await request.json();
    const { content, tripId } = body;

    if (!content || !tripId) {
      return NextResponse.json(
        { error: "Treść zadania i ID wyjazdu są wymagane" },
        { status: 400 }
      );
    }

    const userId = Number(session.user.id);
    await requireTripParticipant(Number(tripId), userId);

    const todo = await db.tripItem.create({
      data: {
        name: content,
        tripId: Number(tripId),
        isCompleted: false,
      },
    });

    return NextResponse.json(todo);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    console.error("Błąd podczas tworzenia zadania:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas zapisywania zadania" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
    }

    const todo = await db.tripItem.findUnique({
      where: { id: Number(id) },
      select: { tripId: true },
    });

    if (!todo) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const userId = Number(session.user.id);
    await requireTripParticipant(todo.tripId, userId);

    await db.tripItem.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    console.error("BŁĄD DELETE TODO:", error);
    return NextResponse.json(
      { error: "Nie udało się usunąć zadania" },
      { status: 500 }
    );
  }
}
