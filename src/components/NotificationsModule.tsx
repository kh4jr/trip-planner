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
  emoji: string | null;
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

  // States for sending custom notifications
  const [activeTab, setActiveTab] = useState<"inbox" | "send">("inbox");
  const [friends, setFriends] = useState<{ id: number; name: string | null; email: string }[]>([]);
  const [trips, setTrips] = useState<{ id: number; name: string }[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [customContent, setCustomContent] = useState<string>("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("🔔");
  const [sendingNotif, setSendingNotif] = useState<boolean>(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (activeTab === "send") {
      fetchFriendsAndTrips();
    }
  }, [activeTab]);

  const fetchFriendsAndTrips = async () => {
    try {
      const [friendsRes, tripsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/trips"),
      ]);
      if (friendsRes.ok) {
        setFriends(await friendsRes.json());
      }
      if (tripsRes.ok) {
        setTrips(await tripsRes.json());
      }
    } catch (err) {
      console.error("Error loading friends/trips:", err);
    }
  };

  const handleSendCustomNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipientId || !customContent.trim() || sendingNotif) return;

    setSendingNotif(true);
    setAlert(null);

    try {
      const link = selectedTripId ? `/trips/${selectedTripId}` : null;
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: Number(selectedRecipientId),
          content: customContent.trim(),
          emoji: selectedEmoji,
          link,
        }),
      });

      if (res.ok) {
        setAlert({ type: "success", text: "Powiadomienie zostało pomyślnie wysłane!" });
        setCustomContent("");
        setSelectedRecipientId("");
        setSelectedTripId("");
        setSelectedEmoji("🔔");
        setActiveTab("inbox");
        fetchNotifications();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Nie udało się wysłać powiadomienia.");
      }
    } catch (err) {
      const error = err as Error;
      setAlert({ type: "error", text: error.message || "Błąd sieci." });
    } finally {
      setSendingNotif(false);
    }
  };

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

  const getIcon = (n: Notification) => {
    if (n.emoji) return n.emoji;
    switch (n.type) {
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

        {notifications.length > 0 && activeTab === "inbox" && (
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

      {/* Tabs */}
      <div className="flex border-b border-blue-50">
        <button
          onClick={() => { setActiveTab("inbox"); setAlert(null); }}
          className={`flex-1 pb-4 text-sm font-black transition-all border-b-2 ${
            activeTab === "inbox"
              ? "border-blue-600 text-blue-900"
              : "border-transparent text-slate-400 hover:text-slate-500"
          }`}
        >
          Skrzynka odbiorcza ({notifications.filter((n) => !n.isRead).length} nowe)
        </button>
        <button
          onClick={() => { setActiveTab("send"); setAlert(null); }}
          className={`flex-1 pb-4 text-sm font-black transition-all border-b-2 ${
            activeTab === "send"
              ? "border-blue-600 text-blue-900"
              : "border-transparent text-slate-400 hover:text-slate-500"
          }`}
        >
          Wyślij powiadomienie 🚀
        </button>
      </div>

      {alert && (
        <div className={`p-4 rounded-xl text-sm font-bold border ${alert.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}>
          {alert.text}
        </div>
      )}

      {activeTab === "send" ? (
        <form onSubmit={handleSendCustomNotification} className="space-y-6 bg-slate-50/50 p-6 md:p-8 rounded-3xl border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Odbiorca */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-blue-900 block">Odbiorca (Znajomy)</label>
              <select
                value={selectedRecipientId}
                onChange={(e) => setSelectedRecipientId(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 focus:border-blue-500 p-4 rounded-xl text-sm font-bold text-blue-900 transition-all outline-none"
              >
                <option value="">Wybierz znajomego...</option>
                {friends.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name || f.email} ({f.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Powiązany wyjazd */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-blue-900 block">Powiązany wyjazd (Opcjonalnie)</label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 p-4 rounded-xl text-sm font-bold text-blue-900 transition-all outline-none"
              >
                <option value="">Brak powiązania</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Wybór emotki */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-blue-900 block">Ikonka powiadomienia (Emotka)</label>
            <div className="flex flex-wrap gap-2">
              {["🔔", "✈️", "🎉", "⚠️", "💬", "🔥", "📍", "🍔", "🎯", "💡", "🌟", "🚗", "🏖️", "🏨", "🗺️", "🚀", "⚡", "📅"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all border ${
                    selectedEmoji === emoji
                      ? "bg-blue-600 border-blue-600 text-white scale-110 shadow-md shadow-blue-200"
                      : "bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 hover:border-slate-200"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Treść */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-blue-900 block">Treść powiadomienia</label>
            <textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="Wpisz treść powiadomienia..."
              required
              rows={3}
              className="w-full bg-white border border-slate-200 focus:border-blue-500 p-4 rounded-xl text-sm font-bold text-blue-900 transition-all outline-none resize-none"
            />
          </div>

          {/* Przycisk wyślij */}
          <button
            type="submit"
            disabled={sendingNotif || !selectedRecipientId || !customContent.trim()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-200 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
          >
            {sendingNotif ? "Wysyłanie..." : `Wyślij powiadomienie ${selectedEmoji}`}
          </button>
        </form>
      ) : (
        /* Notifications list */
        loading ? (
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
                    {getIcon(n)}
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
        )
      )}
    </div>
  );
}
