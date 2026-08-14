import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

// GET /api/trips/invitations -> get received trip invitations for logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 });
    }

    const userId = Number(session.user.id);

    const invitations = await db.tripInvitation.findMany({
      where: {
        inviteeId: userId,
        status: "PENDING"
      },
      include: {
        trip: true,
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error getting received invites:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/trips/invitations -> accept or decline invite
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await req.json();
    const { invitationId, action } = body;

    const invitation = await db.tripInvitation.findUnique({
      where: { id: Number(invitationId) }
    });

    if (!invitation || invitation.inviteeId !== userId) {
      return NextResponse.json({ error: "Zaproszenie nie istnieje" }, { status: 404 });
    }

    if (action === "ACCEPT") {
      await db.tripInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" }
      });

      // Find or create participant for the user
      let participant = await db.participant.findUnique({
        where: { userId }
      });

      if (!participant) {
        participant = await db.participant.create({
          data: {
            userId,
            name: session.user.name || session.user.email || "Uczestnik",
            email: session.user.email || ""
          }
        });
      }

      // Connect participant to trip
      await db.trip.update({
        where: { id: invitation.tripId },
        data: {
          participants: {
            connect: { id: participant.id }
          }
        }
      });
    } else {
      await db.tripInvitation.update({
        where: { id: invitation.id },
        data: { status: "DECLINED" }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error responding to invitation:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
