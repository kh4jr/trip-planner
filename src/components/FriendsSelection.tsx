"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Alert from "@/components/ui/Alert";
import Skeleton from "@/components/ui/Skeleton";
import type { Trip } from "@prisma/client";

type Friend = {
  id: number;
  name: string | null;
  email: string;
  tripsTogether: number;
};

type FriendshipStatus =
  | "NONE"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "ACCEPTED";

type SearchUser = {
  id: number;
  name: string | null;
  email: string;
  friendshipStatus: FriendshipStatus;
};


export default function FriendsSelection({
  refreshKey,
  onSelectTrip,
}: {
  refreshKey: number;
  onSelectTrip: (tripId: number) => void;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [alert, setAlert] = useState<{
  type: "success" | "error" | "info";
  title: string;
  description?: string;
} | null>(null);


  useEffect(() => {
    fetchFriends();
  }, [refreshKey]);

  async function fetchFriends() {
    const res = await fetch("/api/friends");
    if (res.ok) {
      setFriends(await res.json());
    }
  }

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setInfo(null);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      setInfo(null);

      const res = await fetch(`/api/users/search?q=${query}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        if (data.length === 0) {
          setInfo("Nie znaleziono użytkownika");
        }
      }

      setLoading(false);
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  async function handleAddFriend(friendId: number) {
    setActionLoading(friendId);

    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });

    if (res.ok) {
      setAlert({
        type: "success",
        title: "Zaproszenie wysłane",
        description: "Użytkownik otrzymał zaproszenie do znajomych",
      });
    } else {
      setAlert({
        type: "error",
        title: "Błąd",
        description: "Nie udało się wysłać zaproszenia",
      });
    }
    setActionLoading(null);
  }

  async function handleRemoveFriend(friendId: number) {
  setActionLoading(friendId);

  const res = await fetch("/api/friends", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      friendId,
      mode: "friend",
}),
  });

  if (res.ok) {
    setAlert({
      type: "success",
      title: "Znajomy usunięty",
    });
    fetchFriends();
  } else {
    setAlert({
      type: "error",
      title: "Błąd",
      description: "Nie udało się usunąć znajomego",
    });
  }

  setActionLoading(null);
}

  function renderFriendStatus(
  user: SearchUser,
  onAdd: (id: number) => void,
  loadingId: number | null
) {
  switch (user.friendshipStatus) {
    case "NONE":
      return (
        <button
          disabled={loadingId === user.id}
          onClick={() => onAdd(user.id)}
          className="text-xs font-black px-4 py-2 rounded-lg
                     bg-green-600 text-white
                     hover:bg-green-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Dodaj
        </button>
      );

    case "PENDING_SENT":
      return (
        <span className="text-xs font-black text-amber-600">
          ⏳ Zaproszenie wysłane
        </span>
      );

    case "PENDING_RECEIVED":
      return (
        <span className="text-xs font-black text-blue-600">
          📩 Sprawdź zaproszenia
        </span>
      );

    case "ACCEPTED":
      return (
        <span className="text-xs font-black text-green-600">
          ✔ Znajomy
        </span>
      );
  }
}

  return (
    <div className="mt-6 bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50">
      <h3 className="text-sm font-black uppercase tracking-widest text-blue-300 mb-4">
        Znajomi
      </h3>

      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          description={alert.description}
          isVisible={true}
          onClose={() => setAlert(null)}
        />
      )}

      {/* 🔎 INPUT */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Wyszukaj znajomego – wpisz imię lub e-mail"
        className="w-full mb-3 px-4 py-3 rounded-xl border border-blue-100 text-sm font-medium
+            text-blue-900
+            placeholder:text-blue-300
+            focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {info && (
        <p className="text-xs font-bold text-blue-400 mb-3">{info}</p>
      )}

      {/* 🔍 WYNIKI WYSZUKIWANIA */}
{query && (
  <div className="space-y-2 mb-4">
    {loading && (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex justify-between items-center p-3 rounded-xl bg-blue-50"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    )}

    {results.map((u) => {
      const status = u.friendshipStatus ?? "NONE";

      return (
        <div
          key={u.id}
          className="flex justify-between items-center p-3 rounded-xl bg-blue-50"
        >
          <div>
            <p className="font-black text-blue-900">
              {u.name || u.email}
            </p>
            <p className="text-xs text-blue-400">{u.email}</p>
          </div>

          {/* 👉 STATUS ZNAJOMOŚCI */}
          {status === "NONE" && (
            <button
              disabled={actionLoading === u.id}
              onClick={() => handleAddFriend(u.id)}
              className="text-xs font-black px-4 py-2 rounded-lg
                         bg-green-600 text-white
                         hover:bg-green-700
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === u.id ? "..." : "Dodaj"}
            </button>
          )}

          {status === "PENDING_SENT" && (
            <span className="text-xs font-black text-amber-600">
              ⏳ Zaproszenie wysłane
            </span>
          )}

          {status === "PENDING_RECEIVED" && (
            <span className="text-xs font-black text-blue-600">
              📩 Sprawdź zaproszenia
            </span>
          )}

          {status === "ACCEPTED" && (
            <span className="text-xs font-black text-green-600">
              ✔ Znajomy
            </span>
          )}
        </div>
      );
    })}
  </div>
)}

      {/* 👥 LISTA ZNAJOMYCH */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex justify-between items-center p-4 rounded-xl bg-blue-50/40"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      ) : friends.length === 0 ? (
        <p className="text-sm text-slate-400 font-bold">
          Nie masz jeszcze znajomych
        </p>
      ) : (
        <div className="space-y-3">
          {friends.map((f) => (
            <div
              key={f.id}
              className="flex justify-between items-center p-4 rounded-xl bg-blue-50/40"
            >
              <div className="flex flex-col gap-1">
                <Link
                  href={`/profile/${f.id}`}
                  className="font-black text-blue-900 hover:underline leading-tight"
                >
                  {f.name || f.email}
                </Link>

                <button
                  onClick={async () => {
                    const res = await fetch(
                      `/api/trips/common?friendId=${f.id}`
                    );
                    if (!res.ok) return;

                    const trips = await res.json();
                    if (trips.length > 0) {
                      onSelectTrip(trips[0]);
                    }
                  }}
                  className="text-xs text-blue-400 font-bold hover:underline w-fit"
                >
                  Wspólne wyjazdy: {f.tripsTogether}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  disabled={actionLoading === f.id}
                  onClick={() => handleRemoveFriend(f.id)}
                  className="text-xs font-black px-3 py-2 rounded-lg
                            bg-red-50 text-red-600
                            hover:bg-red-100
                            disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


