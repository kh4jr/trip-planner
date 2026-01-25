import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  try {
    const { name, time, tripId } = await req.json();
    
    const newActivity = await prisma.activity.create({
      data: {
        name,
        time: new Date(time),
        tripId: parseInt(tripId)
      }
    });

    return NextResponse.json(newActivity);
  } catch (error) {
    return NextResponse.json({ error: "Błąd zapisu aktywności" }, { status: 500 });
  }
}