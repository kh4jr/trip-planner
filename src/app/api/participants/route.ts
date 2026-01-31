import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get("tripId");

  if (!tripId) return NextResponse.json({ error: "Brak tripId" }, { status: 400 });

  const participants = await db.participant.findMany({
  where: {
    tripId: Number(tripId),
  },
});


  return NextResponse.json(participants);
}