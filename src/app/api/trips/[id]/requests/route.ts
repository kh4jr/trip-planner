import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { requireTripParticipant } from "@/lib/tripAuth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const resolvedParams = await params;
    const tripId = Number(resolvedParams.id);
    const userId = Number(session.user.id);

    // Verify user is not already a participant
    const isParticipant = await db.participant.findFirst({
      where: {
        userId,
        trips: {
          some: { id: tripId }
        }
      }
    });

    if (isParticipant) {
      return NextResponse.json({ error: "Jesteś już uczestnikiem tego wyjazdu" }, { status: 400 });
    }

    const existing = await db.tripRequest.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        }
      }
    });

    if (existing) {
      if (existing.status === "PENDING") {
        return NextResponse.json({ error: "Żądanie oczekuje już na zatwierdzenie" }, { status: 400 });
      }
      await db.tripRequest.update({
        where: { id: existing.id },
        data: { status: "PENDING" }
      });
      return NextResponse.json({ success: true });
    }

    await db.tripRequest.create({
      data: {
        tripId,
        userId,
        status: "PENDING",
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating join request:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const resolvedParams = await params;
    const tripId = Number(resolvedParams.id);
    const userId = Number(session.user.id);

    await requireTripParticipant(tripId, userId);

    const requests = await db.tripRequest.findMany({
      where: {
        tripId,
        status: "PENDING"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching join requests:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const resolvedParams = await params;
    const tripId = Number(resolvedParams.id);
    const userId = Number(session.user.id);

    await requireTripParticipant(tripId, userId);

    const body = await req.json();
    const { requestId, action } = body;

    const request = await db.tripRequest.findUnique({
      where: { id: Number(requestId) }
    });

    if (!request || request.tripId !== tripId) {
      return NextResponse.json({ error: "Żądanie nie istnieje" }, { status: 404 });
    }

    if (action === "APPROVE") {
      await db.tripRequest.update({
        where: { id: request.id },
        data: { status: "APPROVED" }
      });

      let participant = await db.participant.findUnique({
        where: { userId: request.userId }
      });

      if (!participant) {
        const u = await db.user.findUnique({ where: { id: request.userId } });
        participant = await db.participant.create({
          data: {
            userId: request.userId,
            name: u?.name || u?.email || "Uczestnik",
            email: u?.email || ""
          }
        });
      }

      await db.trip.update({
        where: { id: tripId },
        data: {
          participants: {
            connect: { id: participant.id }
          }
        }
      });
    } else {
      await db.tripRequest.update({
        where: { id: request.id },
        data: { status: "REJECTED" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error patching join request:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
