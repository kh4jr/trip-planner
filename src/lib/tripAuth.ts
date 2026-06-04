import { db } from "@/lib/db";

export async function requireTripParticipant(
  tripId: number,
  userId: number
) {
  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      participants: {
        some: {
          userId,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!trip) {
    throw new Error("FORBIDDEN");
  }

  return true;
}

export async function requireTripOwner(
  tripId: number,
  userId: number
) {
  const isParticipant = await requireTripParticipant(tripId, userId);

  if (!isParticipant) {
    throw new Error("FORBIDDEN");
  }
  return true;
}
