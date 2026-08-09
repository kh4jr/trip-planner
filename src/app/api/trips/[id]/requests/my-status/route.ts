import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ status: "NONE" });
    }

    const resolvedParams = await params;
    const tripId = Number(resolvedParams.id);
    const userId = Number(session.user.id);

    const request = await db.tripRequest.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId
        }
      }
    });

    return NextResponse.json({ status: request?.status || "NONE" });
  } catch (error) {
    console.error("Error getting request status:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
