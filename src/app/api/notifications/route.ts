import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { db } from "@/lib/db";

// GET /api/notifications -> List notifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 });
    }

    const userId = Number(session.user.id);
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/notifications -> Mark notification(s) as read
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await req.json().catch(() => ({}));
    const { id } = body;

    if (id) {
      const updated = await db.notification.update({
        where: { id: Number(id), userId },
        data: { isRead: true },
      });
      return NextResponse.json(updated);
    } else {
      // Mark all as read
      const updated = await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/notifications -> Delete a notification
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      // Clear all notifications
      await db.notification.deleteMany({
        where: { userId },
      });
      return NextResponse.json({ success: true });
    }

    await db.notification.delete({
      where: { id: Number(id), userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/notifications -> Send a custom notification
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { recipientId, content, emoji, link } = body;

    if (!recipientId || !content || content.trim() === "") {
      return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
    }

    const recipientExists = await db.user.findUnique({
      where: { id: Number(recipientId) },
    });

    if (!recipientExists) {
      return NextResponse.json({ error: "Odbiorca nie istnieje" }, { status: 404 });
    }

    const senderName = session.user.name || session.user.email;

    const notification = await db.notification.create({
      data: {
        userId: Number(recipientId),
        type: "CUSTOM",
        content: `Wiadomość od ${senderName}: ${content}`,
        emoji: emoji || "🔔",
        link: link || null,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error creating custom notification:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
