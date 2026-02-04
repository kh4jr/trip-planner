import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "Brak userId" }, { status: 400 });

  const participants = await db.participant.findMany({
  where: {
    userId: Number(userId),
  },
});


  return NextResponse.json(participants);
}