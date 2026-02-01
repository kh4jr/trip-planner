"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Friend = {
  id: number;
  name: string | null;
  email: string;
  tripsTogether: number;
};

type SearchUser = {
  id: number;
  name: string | null;
  email: string;
};

export default function FriendsSelection({
  refreshKey,
}: {
  refreshKey: number;
}) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  /* ========================
     POBIERANIE ZNAJOMYCH
  ======================== */
  useEffect(() => {
    fetchFriends();
  }, [refreshKey]); // 🔥 KLUCZOWE

  async function fetchFriends() {
    const res = await fetch("/api/friends");
    if (res.ok) {
      setFriends(await res.json());
    }
  }

  /* ========================
     WYSZUKIWANIE USERÓW
  ======================== */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      const res = await fetch(`/api/users/search?q=${query}`);
      if (res.ok) {
        setResults(await res.json());
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  async function handleAddFriend(friendId: number) {
    await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });
  }

  async function handleRemoveFriend(friendId: number) {
    await fetch("/api/friends", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId }),
    });
    fetchFriends();
  }

  return (
    <div className="mt-6 bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50">
      <h3 className="text-sm font-black uppercase tracking-widest text-blue-300 mb-4">
        Znajomi
      </h3>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Szukaj znajomych..."
        className="w-full mb-4 px-4 py-2 rounded-xl border border-blue-100 text-sm"
      />

      {/* 🔍 WYNIKI WYSZUKIWANIA */}
      {query && (
        <div className="space-y-2 mb-4">
          {loading && <p className="text-xs text-slate-400">Szukam...</p>}
          {results.map((u) => (
            <div
              key={u.id}
              className="flex justify-between items-center p-3 rounded-xl bg-blue-50"
            >
              <div>
                <p className="font-bold text-blue-900">
                  {u.name || u.email}
                </p>
                <p className="text-xs text-blue-400">{u.email}</p>
              </div>
              <button
                onClick={() => handleAddFriend(u.id)}
                className="text-xs font-black px-3 py-2 rounded-lg bg-green-600 text-white"
              >
                Dodaj
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 👥 LISTA ZNAJOMYCH */}
      {friends.length === 0 ? (
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
              <div>
                <p className="font-black text-blue-900">
                  {f.name || f.email}
                </p>
                <p className="text-xs text-blue-400 font-bold">
                  Wspólne wyjazdy: {f.tripsTogether}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/profile/${f.id}`}
                  className="text-xs font-black px-3 py-2 rounded-lg bg-white border border-blue-100"
                >
                  Profil
                </Link>
                <button
                  onClick={() => handleRemoveFriend(f.id)}
                  className="text-xs font-black px-3 py-2 rounded-lg bg-red-50 text-red-600"
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



