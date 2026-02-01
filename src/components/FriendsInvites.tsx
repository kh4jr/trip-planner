"use client";

import { useEffect, useState } from "react";

type Invite = {
  id: number;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
};

export default function FriendsInvites({
  onAction,
}: {
  onAction: () => void;
}) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvites();
  }, []);

  async function fetchInvites() {
    try {
      const res = await fetch("/api/friends/invites");
      if (!res.ok) return;
      setInvites(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(inviteId: number) {
    await fetch("/api/friends", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId }),
    });

    await fetchInvites();
    onAction(); // 🔥 odświeża FriendsSelection
  }

  async function handleReject(inviteId: number) {
    await fetch("/api/friends", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId }),
    });
    fetchInvites();
  }

  if (loading || invites.length === 0) return null;

  return (
    <div className="mt-6 bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50">
      <h3 className="text-sm font-black uppercase tracking-widest text-blue-300 mb-4">
        Zaproszenia do znajomych
      </h3>

      <div className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex justify-between items-center p-4 rounded-xl bg-amber-50"
          >
            <div>
              <p className="font-black text-blue-900">
                {invite.user.name || invite.user.email}
              </p>
              <p className="text-xs text-blue-400 font-bold">
                wysłał zaproszenie
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(invite.id)}
                className="px-3 py-2 text-xs font-black bg-green-100 text-green-700 rounded-lg"
              >
                Akceptuj
              </button>
              <button
                onClick={() => handleReject(invite.id)}
                className="px-3 py-2 text-xs font-black bg-red-100 text-red-600 rounded-lg"
              >
                Odrzuć
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

