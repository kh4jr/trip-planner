import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // upewnij się, że masz poprawny import do instancji prisma

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "Brak tripId" }, { status: 400 });
    }

    const notes = await prisma.note.findMany({
      where: {
        tripId: parseInt(tripId),
      },
      orderBy: {
        createdAt: "asc", // Notatki będą w kolejności dodawania
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Błąd API Notes:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { id, isCompleted } = await request.json();
  const updated = await prisma.note.update({
    where: { id: Number(id) },
    data: { isCompleted }
  });
  return Response.json(updated);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  await prisma.note.delete({
    where: { id: Number(id) }
  });
  return Response.json({ success: true });
}