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

    const expenses = await db.expense.findMany({
      where: { tripId: parseInt(tripId) },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 });
    }

    const body = await req.json();
    const tripId = parseInt(body.tripId);
    const userId = Number(session.user.id);

    await requireTripParticipant(tripId, userId);

    const newExpense = await db.expense.create({
      data: {
        description: body.description,
        amount: parseFloat(body.amount),
        paidBy: body.paidBy,
        category: body.category || "other",
        tripId: tripId,
      },
    });

    return NextResponse.json(newExpense);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const msg = error instanceof Error ? error.message : "Błąd zapisu wydatku";
    return NextResponse.json({ error: msg }, { status: 500 });
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

    const expense = await db.expense.findUnique({
      where: { id: Number(id) },
      select: { tripId: true },
    });

    if (!expense) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const userId = Number(session.user.id);
    await requireTripParticipant(expense.tripId, userId);

    await db.expense.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    console.error("BŁĄD DELETE EXPENSE:", error);
    return NextResponse.json(
      { error: "Nie udało się usunąć wydatku" },
      { status: 500 }
    );
  }
}
