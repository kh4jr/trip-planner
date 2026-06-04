import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get("tripId");
  if (!tripId) return NextResponse.json([]);

  const expenses = await db.expense.findMany({
    where: { tripId: parseInt(tripId) },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const newExpense = await db.expense.create({
      data: {
        description: body.description,
        amount: parseFloat(body.amount),
        paidBy: body.paidBy,
        category: body.category || "other",
        tripId: parseInt(body.tripId),
      },
    });

    return NextResponse.json(newExpense);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Błąd zapisu wydatku";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
    }

    await db.expense.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BŁĄD DELETE EXPENSE:", error);
    return NextResponse.json(
      { error: "Nie udało się usunąć wydatku" },
      { status: 500 }
    );
  }
}
