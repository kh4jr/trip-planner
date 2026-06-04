import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "Brak tripId" }, { status: 400 });
    }

    const todos = await db.tripItem.findMany({
      where: { tripId: Number(tripId) },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json(
      { error: "Błąd pobierania zadań" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, tripId } = body;

    if (!content || !tripId) {
      return NextResponse.json(
        { error: "Treść zadania i ID wyjazdu są wymagane" },
        { status: 400 }
      );
    }

    const todo = await db.tripItem.create({
      data: {
        name: content,
        tripId: Number(tripId),
        isCompleted: false,
      },
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error("Błąd podczas tworzenia zadania:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas zapisywania zadania" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
    }

    await db.tripItem.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BŁĄD DELETE TODO:", error);
    return NextResponse.json(
      { error: "Nie udało się usunąć zadania" },
      { status: 500 }
    );
  }
}
