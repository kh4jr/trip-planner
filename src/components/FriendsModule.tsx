"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Skeleton from "@/components/ui/Skeleton";

type Friend = {
  id: number;
  name: string | null;
  email: string;
  tripsTogether: number;
};

type FriendshipStatus = "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED";

type SearchUser = {
  id: number;
  name: string | null;
  email: string;
  friendshipStatus: FriendshipStatus;
};

type Invite = {
  id: number;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
};

export default function FriendsModule() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    title: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    fetchFriends();
    fetchInvites();
  }, []);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  async function fetchFriends() {
    setLoading(true);
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        setFriends(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvites() {
    try {
      const res = await fetch("/api/friends/invites");
      if (res.ok) {
        setInvites(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  }
  async function searchUsers() {
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  }

  const handleSendRequest = async (friendId: number) => {
    setActionLoading(friendId);
    setAlert(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      if (res.ok) {
        setAlert({
          type: "success",
          title: "Zaproszenie wysłane",
          description: "Oczekiwanie na akceptację znajomego",
        });
        searchUsers();
      } else {
        const data = await res.json();
        setAlert({
          type: "error",
          title: "Błąd",
          description: data.error || "Nie udało się wysłać zaproszenia",
        });
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: "error", title: "Błąd", description: "Wystąpił błąd sieci" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptInvite = async (friendId: number) => {
    setActionLoading(friendId);
    setAlert(null);
    try {
      const res = await fetch("/api/friends", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });

      if (res.ok) {
        setAlert({
          type: "success",
          title: "Zaproszenie zaakceptowane",
          description: "Znajomy został dodany do Twojej listy",
        });
        await fetchFriends();
        await fetchInvites();
        if (query) searchUsers();
      } else {
        setAlert({
          type: "error",
          title: "Błąd",
          description: "Nie udało się zaakceptować zaproszenia",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectInvite = async (friendId: number, mode: "invite" | "friend" = "invite") => {
    setActionLoading(friendId);
    setAlert(null);
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId, mode }),
      });

      if (res.ok) {
        setAlert({
          type: "info",
          title: mode === "invite" ? "Zaproszenie odrzucone" : "Znajomy usunięty",
        });
        await fetchFriends();
        await fetchInvites();
        if (query) searchUsers();
      } else {
        setAlert({
          type: "error",
          title: "Błąd",
          description: "Nie udało się wykonać operacji",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };
  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-blue-50 shadow-2xl shadow-blue-100/50 w-full min-h-[600px] text-left space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200">
          👥
        </div>
        <div>
          <h2 className="text-2xl font-black text-blue-900 leading-tight">Znajomi</h2>
          <p className="text-sm text-blue-300 font-bold">Wyszukuj ludzi i planujcie wspólne podróże</p>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          description={alert.description}
          isVisible={true}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Search & Invites */}
        <div className="space-y-6">
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-wider text-blue-900 mb-4">
              Dodaj znajomego
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Wyszukaj znajomego - wpisz imię lub e-mail"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 p-4 rounded-xl text-sm font-bold text-blue-900 transition-all outline-none"
              />
              {searchLoading && (
                <div className="absolute right-4 top-4 text-xs font-bold text-blue-400">
                  Szukam...
                </div>
              )}
            </div>

            {results.length > 0 && (
              <div className="mt-4 space-y-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-inner max-h-[300px] overflow-y-auto">
                {results.map((u) => (
                  <div key={u.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-all">
                    <div>
                      <p className="text-sm font-black text-blue-900">{u.name || "Użytkownik"}</p>
                      <p className="text-xs text-slate-400 font-bold">{u.email}</p>
                    </div>

                    <div>
                      {u.friendshipStatus === "NONE" && (
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleSendRequest(u.id)}
                          className="px-4 py-2 text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95 disabled:opacity-50"
                        >
                          Zaproś
                        </button>
                      )}
                      {u.friendshipStatus === "PENDING_SENT" && (
                        <span className="text-[10px] uppercase font-black tracking-wider text-amber-500 bg-amber-50 p-2 px-3 rounded-lg border border-amber-100">
                          Wysłano
                        </span>
                      )}
                      {u.friendshipStatus === "PENDING_RECEIVED" && (
                        <button
                          disabled={actionLoading === u.id}
                          onClick={() => handleAcceptInvite(u.id)}
                          className="px-4 py-2 text-xs font-black rounded-xl bg-green-600 hover:bg-green-700 text-white transition"
                        >
                          Akceptuj
                        </button>
                      )}
                      {u.friendshipStatus === "ACCEPTED" && (
                        <span className="text-[10px] uppercase font-black tracking-wider text-green-600 bg-green-50 p-2 px-3 rounded-lg border border-green-100">
                          Znajomy
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Incoming invites */}
          {invites.length > 0 && (
            <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-900 mb-4">
                Zaproszenia do znajomych ({invites.length})
              </h3>
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex justify-between items-center p-4 rounded-2xl bg-white border border-amber-100 shadow-sm">
                    <div>
                      <p className="text-sm font-black text-blue-900">{invite.user.name || invite.user.email}</p>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">wysłał zaproszenie</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={actionLoading === invite.user.id}
                        onClick={() => handleAcceptInvite(invite.user.id)}
                        className="px-3 py-2 text-xs font-black rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
                      >
                        Tak
                      </button>
                      <button
                        disabled={actionLoading === invite.user.id}
                        onClick={() => handleRejectInvite(invite.user.id, "invite")}
                        className="px-3 py-2 text-xs font-black rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 transition"
                      >
                        Nie
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Friends List */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-blue-900 mb-4">
            Twoja lista znajomych
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : friends.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 rounded-3xl text-center text-slate-400 font-bold">
              Nie masz jeszcze dodanych żadnych znajomych.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {friends.map((f) => (
                <div key={f.id} className="flex justify-between items-center p-4 rounded-2xl border border-slate-50 bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black">
                      {f.name ? f.name.charAt(0).toUpperCase() : f.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-blue-900 leading-tight">
                        {f.name || "Użytkownik"}
                      </p>
                      <p className="text-xs text-blue-300 font-bold mb-1">
                        {f.email}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Wspólne wyjazdy: {f.tripsTogether}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={actionLoading === f.id}
                    onClick={() => handleRejectInvite(f.id, "friend")}
                    className="p-2 px-3 hover:bg-red-50 text-red-400 hover:text-red-600 text-xs font-black uppercase tracking-wider rounded-xl transition"
                  >
                    Usuń
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
