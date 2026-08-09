"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Skeleton from "@/components/ui/Skeleton";

type Notification = {
  id: number;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  link: string | null;
};

export default function NotificationsModule({
  onNavigateToMessages,
  onNavigateToFriends,
  onRefreshTrips,
}: {
  onNavigateToMessages: (friendId?: number) => void;
  onNavigateToFriends: () => void;
  onRefreshTrips: () => void;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id?: number) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        if (id) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
          );
        } else {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id?: number) => {
    try {
      const url = id ? `/api/notifications?id=${id}` : "/api/notifications";
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        if (id) {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        } else {
          setNotifications([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFriendAction = async (notifId: number, requesterEmail: string, action: "ACCEPT" | "REJECT") => {
    setActionLoading(notifId);
    setAlert(null);
    try {
      // 1. Fetch user search to find requester ID
      const userRes = await fetch(`/api/users?query=${encodeURIComponent(requesterEmail)}`);
      if (!userRes.ok) throw new Error("Nie znaleziono użytkownika");
      const users = await userRes.json();
      const requester = users.find((u: { email: string; id: number }) => u.email === requesterEmail);
      if (!requester) throw new Error("Nie znaleziono użytkownika");

      // 2. Perform accept or reject action
      if (action === "ACCEPT") {
        const res = await fetch("/api/friends", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId: requester.id }),
        });
        if (res.ok) {
          setAlert({ type: "success", text: "Zaakceptowano zaproszenie do znajomych." });
          await handleMarkAsRead(notifId);
          onRefreshTrips();
        } else {
          throw new Error("Błąd podczas akceptacji zaproszenia.");
        }
      } else {
        const res = await fetch("/api/friends", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId: requester.id, mode: "invite" }),
        });
        if (res.ok) {
          setAlert({ type: "success", text: "Odrzucono zaproszenie do znajomych." });
          await handleMarkAsRead(notifId);
        } else {
          throw new Error("Błąd podczas odrzucania zaproszenia.");
        }
      }
    } catch (err) {
      const error = err as Error;
      setAlert({ type: "error", text: error.message || "Błąd sieci." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTripAction = async (notifId: number, tripName: string, action: "ACCEPT" | "DECLINE") => {
    setActionLoading(notifId);
    setAlert(null);
    try {
      // 1. Load received trip invitations
      const inviteRes = await fetch("/api/trips/invitations");
      if (!inviteRes.ok) throw new Error("Błąd ładowania zaproszeń.");
      const invites = await inviteRes.json();
      const matchingInvite = invites.find((i: { id: number; trip: { name: string } }) => i.trip.name === tripName);

      if (!matchingInvite) {
        throw new Error("Nie znaleziono zaproszenia na wyjazd (być może zostało już rozpatrzone).");
      }

      // 2. Submit PATCH to accept or decline
      const res = await fetch(`/api/trips/invitations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: matchingInvite.id, action }),
      });

      if (res.ok) {
        setAlert({
          type: "success",
          text: action === "ACCEPT" ? "Dołączono do wyjazdu!" : "Odrzucono zaproszenie na wyjazd.",
        });
        await handleMarkAsRead(notifId);
        onRefreshTrips();
      } else {
        throw new Error("Błąd podczas wysyłania odpowiedzi.");
      }
    } catch (err) {
      const error = err as Error;
      setAlert({ type: "error", text: error.message || "Błąd sieci." });
    } finally {
      setActionLoading(null);
    }
  };

  const parseFriendRequesterEmail = (content: string) => {
    // "Otrzymałeś zaproszenie do znajomych od name (email)"
    // or just the email at the end. We'll search for email pattern.
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const match = content.match(emailRegex);
    return match ? match[0] : "";
  };

  const parseTripName = (content: string) => {
    // 'Zostałeś zaproszony na wyjazd "TripName" przez ...'
    const match = content.match(/"([^"]+)"/);
    return match ? match[1] : "";
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "FRIEND_REQUEST":
        return "👤➕";
      case "FRIEND_ACCEPTED":
        return "🤝";
      case "TRIP_INVITE":
        return "✈️📬";
      case "NEW_MESSAGE":
        return "💬";
      default:
        return "🔔";
    }
  };

  const handleNotificationClick = (n: Notification) => {
    handleMarkAsRead(n.id);
    if (n.type === "NEW_MESSAGE" && n.link) {
      // link is like "/messages?friendId=5"
      const urlParams = new URLSearchParams(n.link.split("?")[1]);
      const friendId = Number(urlParams.get("friendId"));
      onNavigateToMessages(friendId);
    } else if ((n.type === "FRIEND_REQUEST" || n.type === "FRIEND_ACCEPTED")) {
      onNavigateToFriends();
    }
  };
  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-blue-50 shadow-2xl shadow-blue-100/50 w-full min-h-[600px] text-left space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200">
            🔔
          </div>
          <div>
            <h2 className="text-2xl font-black text-blue-900 leading-tight">Powiadomienia</h2>
            <p className="text-sm text-blue-300 font-bold">Bądź na bieżąco z aktywnościami</p>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleMarkAsRead()}
              className="px-4 py-2 text-xs font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
            >
              Oznacz jako przeczytane
            </button>
            <button
              onClick={() => handleDelete()}
              className="px-4 py-2 text-xs font-black text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition"
            >
              Wyczyść wszystkie
            </button>
          </div>
        )}
      </div>

      {alert && (
        <div className={`p-4 rounded-xl text-sm font-bold border ${alert.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
          {alert.text}
        </div>
      )}

      {/* Notifications list */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-slate-100 rounded-3xl text-center text-slate-400 font-bold">
          Brak powiadomień.
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:shadow-sm ${
                n.isRead
                  ? "bg-slate-50/50 border-slate-100/50 opacity-70"
                  : "bg-blue-50/20 border-blue-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg">
                  {getIcon(n.type)}
                </div>
                <div>
                  <p className={`text-sm ${n.isRead ? "text-slate-600 font-medium" : "text-blue-900 font-black"}`}>
                    {n.content}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                {n.type === "FRIEND_REQUEST" && !n.isRead && (
                  <>
                    <button
                      disabled={actionLoading === n.id}
                      onClick={() => handleFriendAction(n.id, parseFriendRequesterEmail(n.content), "ACCEPT")}
                      className="px-3 py-1.5 text-xs font-black bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      Akceptuj
                    </button>
                    <button
                      disabled={actionLoading === n.id}
                      onClick={() => handleFriendAction(n.id, parseFriendRequesterEmail(n.content), "REJECT")}
                      className="px-3 py-1.5 text-xs font-black bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition"
                    >
                      Odrzuć
                    </button>
                  </>
                )}

                {n.type === "TRIP_INVITE" && !n.isRead && (
                  <>
                    <button
                      disabled={actionLoading === n.id}
                      onClick={() => handleTripAction(n.id, parseTripName(n.content), "ACCEPT")}
                      className="px-3 py-1.5 text-xs font-black bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      Dołącz
                    </button>
                    <button
                      disabled={actionLoading === n.id}
                      onClick={() => handleTripAction(n.id, parseTripName(n.content), "DECLINE")}
                      className="px-3 py-1.5 text-xs font-black bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition"
                    >
                      Odrzuć
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition text-slate-300 hover:text-red-500"
                  title="Usuń powiadomienie"
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
