"use client";

import Link from "next/link";

type Friend = {
  id: number;
  name: string;
  email: string;
  tripsTogether: number;
};

const MOCK_FRIENDS: Friend[] = [
  { id: 1, name: "Anna Kowalska", email: "anna@mail.com", tripsTogether: 3 },
  { id: 2, name: "Piotr Nowak", email: "piotr@mail.com", tripsTogether: 1 },
];

export default function FriendsSection() {
  return (
    <div className="mt-8 bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-blue-300">
          Znajomi
        </h3>

        <button className="text-xs font-black text-blue-600 hover:text-blue-800 transition">
          + Szukaj znajomych
        </button>
      </div>

      {MOCK_FRIENDS.length === 0 ? (
        <p className="text-sm text-slate-400 font-bold">
          Nie masz jeszcze żadnych znajomych
        </p>
      ) : (
        <div className="space-y-3">
          {MOCK_FRIENDS.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-4 rounded-xl bg-blue-50/40 hover:bg-blue-50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black">
                  {friend.name.charAt(0)}
                </div>

                <div className="text-left">
                  <p className="font-black text-blue-900 leading-tight">
                    {friend.name}
                  </p>
                  <p className="text-[11px] text-blue-400 font-bold">
                    Wspólne wyjazdy: {friend.tripsTogether}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="#"
                  className="text-xs font-black px-3 py-2 rounded-lg bg-white border border-blue-100 text-blue-600 hover:bg-blue-100 transition"
                >
                  Profil
                </Link>

                <button
                  className="text-xs font-black px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
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
