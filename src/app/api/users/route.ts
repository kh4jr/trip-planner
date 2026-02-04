import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const meId = session?.user?.id ? Number(session.user.id) : null;

  if (!meId) {
    return NextResponse.json([], { status: 200 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json([], { status: 200 });
  }

  const users = await db.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
      NOT: { id: meId },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    take: 5,
  });

  if (users.length === 0) {
    return NextResponse.json([]);
  }

  const userIds = users.map((u) => u.id);

  const friendships = await db.friend.findMany({
    where: {
      OR: [
        {
          userId: meId,
          friendId: { in: userIds },
        },
        {
          userId: { in: userIds },
          friendId: meId,
        },
      ],
    },
  });

  function getStatus(otherUserId: number) {
    const relation = friendships.find(
      (f) =>
        (f.userId === meId && f.friendId === otherUserId) ||
        (f.userId === otherUserId && f.friendId === meId)
    );

    if (!relation) return "NONE";

    if (relation.status === "ACCEPTED") {
      return "ACCEPTED";
    }

    if (relation.userId === meId) {
      return "PENDING_SENT";
    }

    return "PENDING_RECEIVED";
  }

  const result = users.map((u) => ({
    ...u,
    friendshipStatus: getStatus(u.id),
  }));

  return NextResponse.json(result);
}

