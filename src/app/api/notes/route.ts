import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
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
    await requireTripParticipant(parseInt(tripId), userId);

    const notes = await db.note.findMany({
      where: {
        tripId: parseInt(tripId),
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    console.error("Błąd API Notes:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }

    const { id, isCompleted } = await request.json();
    const note = await db.note.findUnique({
      where: { id: Number(id) },
      select: { tripId: true },
    });

    if (!note) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const userId = Number(session.user.id);
    await requireTripParticipant(note.tripId, userId);

    const updated = await db.note.update({
      where: { id: Number(id) },
      data: { isCompleted }
    });
    return Response.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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

    const note = await db.note.findUnique({
      where: { id: Number(id) },
      select: { tripId: true },
    });

    if (!note) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const userId = Number(session.user.id);
    await requireTripParticipant(note.tripId, userId);

    await db.note.delete({
      where: { id: Number(id) }
    });
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}