import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { db } from "@/lib/db";

// GET /api/messages -> Fetch messages with a friend OR summary of all chats
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const { searchParams } = new URL(req.url);
    const friendIdParam = searchParams.get("friendId");

    // 1. If friendId is provided, retrieve specific chat history
    if (friendIdParam) {
      const friendId = Number(friendIdParam);
      if (isNaN(friendId)) {
        return NextResponse.json({ error: "Invalid friendId" }, { status: 400 });
      }

      // Fetch messages between userId and friendId
      const messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Mark received messages as read
      await db.message.updateMany({
        where: {
          senderId: friendId,
          receiverId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      // Mark matching message notifications as read
      await db.notification.updateMany({
        where: {
          userId: userId,
          type: "NEW_MESSAGE",
          isRead: false,
          link: `/messages?friendId=${friendId}`,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json(messages);
    }

    // 2. If no friendId is provided, get list of active chats/contacts
    // First, find all users that have exchanged messages with current user
    const sentMessages = await db.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ["receiverId"],
    });

    const receivedMessages = await db.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ["senderId"],
    });

    const contactIds = Array.from(
      new Set([
        ...sentMessages.map((m) => m.receiverId),
        ...receivedMessages.map((m) => m.senderId),
      ])
    );

    // Also include all accepted friends as potential chat contacts
    const friendships = await db.friend.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ userId: userId }, { friendId: userId }],
      },
      include: {
        user: true,
        friend: true,
      },
    });

    friendships.forEach((f) => {
      const friendId = f.userId === userId ? f.friendId : f.userId;
      if (!contactIds.includes(friendId)) {
        contactIds.push(friendId);
      }
    });

    const chats = await Promise.all(
      contactIds.map(async (contactId) => {
        const contact = await db.user.findUnique({
          where: { id: contactId },
          select: { id: true, name: true, email: true },
        });

        if (!contact) return null;

        // Fetch last message
        const lastMessage = await db.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: contactId },
              { senderId: contactId, receiverId: userId },
            ],
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Count unread received messages
        const unreadCount = await db.message.count({
          where: {
            senderId: contactId,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          contact,
          lastMessage,
          unreadCount,
        };
      })
    );

    const sortedChats = chats
      .filter((c) => c !== null)
      .sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return dateB - dateA;
      });

    return NextResponse.json(sortedChats);
  } catch (error) {
    console.error("Error loading messages:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/messages -> Send a message
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const senderId = Number(session.user.id);
    const body = await req.json();
    const { receiverId, content, notify = true } = body;

    if (!receiverId || !content || content.trim() === "") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        senderId,
        receiverId: Number(receiverId),
        content,
      },
    });

    // Create a notification for the receiver if notify is true
    if (notify) {
      await db.notification.create({
        data: {
          userId: Number(receiverId),
          type: "NEW_MESSAGE",
          content: `Nowa wiadomość od ${session.user.name || session.user.email}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
          link: `/messages?friendId=${senderId}`,
        },
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
