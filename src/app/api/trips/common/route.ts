import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const meId = session?.user?.id ? Number(session.user.id) : null;

  if (!meId) {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(req.url);
  const friendId = Number(searchParams.get("friendId"));

  if (!friendId) {
    return NextResponse.json([], { status: 200 });
  }

  const trips = await db.trip.findMany({
    where: {
      participants: {
        some: { userId: meId },
      },
      AND: {
        participants: {
          some: { userId: friendId },
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });

  return NextResponse.json(trips);
}
