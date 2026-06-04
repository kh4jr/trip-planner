import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const meId = session?.user?.id ? Number(session.user.id) : null;

  if (!meId) {
    return NextResponse.json([], { status: 200 });
  }

  const friends = await db.friend.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ userId: meId }, { friendId: meId }],
    },
    include: {
      user: true,
      friend: true,
    },
  });

  const myTrips = await db.trip.findMany({
    where: {
      participants: {
        some: {
          userId: meId,
        },
      },
    },
    select: {
      id: true,
      participants: {
        select: {
          userId: true,
        },
      },
    },
  });

  const result = friends.map((f) => {
    const other =
      f.userId === meId ? f.friend : f.user;

    const tripsTogether = myTrips.filter((trip) =>
      trip.participants.some(
        (p) => p.userId === other.id
      )
    ).length;

    return {
      id: other.id,
      name: other.name,
      email: other.email,
      tripsTogether,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (!userId) {
    return NextResponse.json({ error: "Brak sesji" }, { status: 401 });
  }

  const { friendId } = await req.json();

  if (!friendId || friendId === userId) {
    return NextResponse.json(
      { error: "Nieprawidłowy friendId" },
      { status: 400 }
    );
  }

  const existing = await db.friend.findFirst({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Relacja już istnieje" },
      { status: 409 } 
    );
  }

  const invite = await db.friend.create({
    data: {
      userId,
      friendId,
      status: "PENDING",
    },
  });

  return NextResponse.json(invite);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const meId = session?.user?.id ? Number(session.user.id) : null;

  if (!meId) {
    return NextResponse.json({ error: "Brak auth" }, { status: 401 });
  }

  const { friendId, mode } = await req.json();

  if (!friendId || !mode) {
    return NextResponse.json(
      { error: "Brak danych" },
      { status: 400 }
    );
  }

  if (mode === "invite") {
    await db.friend.deleteMany({
      where: {
        userId: friendId,   
        friendId: meId,     
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true });
  }

  if (mode === "friend") {
    await db.friend.deleteMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { userId: meId, friendId },
          { userId: friendId, friendId: meId },
        ],
      },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { error: "Nieznany tryb" },
    { status: 400 }
  );
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (!userId) {
    return NextResponse.json({ error: "Brak sesji" }, { status: 401 });
  }

  const { friendId } = await req.json();

  if (!friendId) {
    return NextResponse.json(
      { error: "Brak friendId" },
      { status: 400 }
    );
  }

  const invite = await db.friend.findFirst({
    where: {
      userId: friendId,
      friendId: userId,
      status: "PENDING",
    },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Nie znaleziono zaproszenia" },
      { status: 404 }
    );
  }

  const updated = await db.friend.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" },
  });

  return NextResponse.json(updated);
}
