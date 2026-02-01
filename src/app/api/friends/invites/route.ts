import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "../../../../lib/db"; 
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  console.log("SESSION IN INVITES:", session);

  const userId = session?.user?.id ? Number(session.user.id) : null;

  console.log("USER ID IN INVITES:", userId);


  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }

  const invites = await db.friend.findMany({
    where: {
      friendId: userId,
      status: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(invites);
}


