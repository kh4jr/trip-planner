import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { requireTripParticipant } from "@/lib/tripAuth";

// POST /api/trips/[id]/invitations -> invite a friend
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
    const inviterId = Number(session.user.id);

    await requireTripParticipant(tripId, inviterId);

    const body = await req.json();
    const inviteeId = Number(body.inviteeId);

    if (!inviteeId) {
      return NextResponse.json({ error: "Missing inviteeId" }, { status: 400 });
    }

    // Check if invitee is already a participant
    const isParticipant = await db.participant.findFirst({
      where: {
        userId: inviteeId,
        trips: {
          some: { id: tripId }
        }
      }
    });

    if (isParticipant) {
      return NextResponse.json({ error: "Użytkownik jest już uczestnikiem" }, { status: 400 });
    }

    // Fetch trip details for the notification content
    const trip = await db.trip.findUnique({
      where: { id: tripId },
      select: { name: true }
    });
    const tripName = trip?.name || "Wyjazd";

    // Upsert or create invitation
    const invitation = await db.tripInvitation.upsert({
      where: {
        tripId_inviteeId: {
          tripId,
          inviteeId
        }
      },
      update: {
        status: "PENDING",
        inviterId
      },
      create: {
        tripId,
        inviteeId,
        inviterId,
        status: "PENDING"
      }
    });

    // Utwórz powiadomienie o zaproszeniu na wyjazd
    await db.notification.create({
      data: {
        userId: inviteeId,
        type: "TRIP_INVITE",
        content: `Zostałeś zaproszony na wyjazd "${tripName}" przez ${session.user?.name || session.user?.email || "Użytkownik"}`,
        link: "/", // The user can see trip invitation list on dashboard
      }
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/trips/[id]/invitations -> get sent invitations for a trip
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

    const invitations = await db.tripInvitation.findMany({
      where: { tripId },
      include: {
        invitee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
