import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tripId = searchParams.get('tripId');
  if (!tripId) return NextResponse.json([]);
  
  const activities = await db.activity.findMany({
    where: { tripId: parseInt(tripId) },
    orderBy: { time: 'asc' }
  });
  return NextResponse.json(activities);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Próba zapisu aktywności:", body);

    const newActivity = await db.activity.create({
      data: {
        name: body.name,
        time: new Date(body.time),
        tripId: parseInt(body.tripId)
      }
    });

    return NextResponse.json(newActivity);
  } catch (error) {

    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
    
    console.error("BŁĄD PRISMA:", errorMessage);
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}