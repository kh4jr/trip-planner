import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const resolvedParams = await params;
    const tripId = Number(resolvedParams.id);
    const targetUserId = Number(resolvedParams.userId);
    const sessionUserId = Number(session.user.id);

    // Get the trip to verify
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      include: { participants: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Leave instantly if self, or owner deleting someone
    if (targetUserId !== sessionUserId && sessionUserId !== trip.ownerId) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const participant = await db.participant.findFirst({
      where: {
        userId: targetUserId,
        trips: {
          some: { id: tripId }
        }
      }
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    await db.trip.update({
      where: { id: tripId },
      data: {
        participants: {
          disconnect: { id: participant.id }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving trip:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
