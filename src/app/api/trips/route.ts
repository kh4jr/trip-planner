import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // Poprawiona ścieżka

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Brak sesji" }, { status: 401 });

  try {
    const { name, destination, startDate, endDate } = await req.json();
    const newTrip = await prisma.trip.create({
      data: {
        name,
        destination,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        user: { connect: { email: session.user.email } } // Łączenie z użytkownikiem Yaroslav
      }
    });
    return NextResponse.json(newTrip);
  } catch (error) {
    return NextResponse.json({ error: "Błąd zapisu" }, { status: 500 });
  }
}