import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

/* =======================
   GET – lista znajomych
======================= */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }

  const friends = await db.friend.findMany({
    where: {
      OR: [
        { userId, status: "ACCEPTED" },
        { friendId: userId, status: "ACCEPTED" },
      ],
    },
    include: {
      user: true,
      friend: true,
    },
  });

  const mapped = friends.map(f => {
    const other =
      f.userId === userId ? f.friend : f.user;

    return {
      id: other.id,
      name: other.name,
      email: other.email,
      tripsTogether: 0, // policzymy później
    };
  });

  return NextResponse.json(mapped);
}

/* =======================
   POST – dodaj znajomego
======================= */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (!userId) {
    return NextResponse.json({ error: "Brak sesji" }, { status: 401 });
  }

  const { friendId } = await req.json();

  if (!friendId || friendId === userId) {
    return NextResponse.json({ error: "Nieprawidłowy friendId" }, { status: 400 });
  }

  // ❗ KLUCZOWE
  const invite = await db.friend.create({
    data: {
      userId,          // kto wysyła
      friendId,        // kto otrzymuje
      status: "PENDING",
    },
  });

  return NextResponse.json(invite);
}

/* =======================
   DELETE – usuń znajomego
======================= */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);
  const { friendId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Brak auth" }, { status: 401 });
  }

  await db.friend.deleteMany({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });

  return NextResponse.json({ success: true });
}


