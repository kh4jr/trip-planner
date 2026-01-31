import { NextResponse } from "next/server";
import { db } from "@/lib/db"; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, category, tripId } = body;

    if (!content || !tripId) {
      return NextResponse.json(
        { error: "Treść zadania i ID wyjazdu są wymagane" },
        { status: 400 }
      );
    }

    const todo = await db.todo.create({
      data: {
        content,
        category: category || "Inne",
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "Brak tripId" }, { status: 400 });
    }

    const todos = await db.todo.findMany({
      where: {
        tripId: Number(tripId),
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json({ error: "Błąd pobierania zadań" }, { status: 500 });
  }
}