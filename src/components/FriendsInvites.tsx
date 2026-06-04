"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";

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
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    title: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    fetchInvites();
  }, []);

  async function fetchInvites() {
    setLoading(true);
    try {
      const res = await fetch("/api/friends/invites");
      if (!res.ok) return;
      setInvites(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(invite: Invite) {
    setActionLoading(invite.id);
    setAlert(null);

    const res = await fetch("/api/friends", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        friendId: invite.user.id,
      }),
    });

    if (res.ok) {
      setAlert({
        type: "success",
        title: "Zaproszenie zaakceptowane",
        description: "Znajomy został dodany do Twojej listy",
      });
      await fetchInvites();
      onAction();
    } else {
      setAlert({
        type: "error",
        title: "Błąd",
        description: "Nie udało się zaakceptować zaproszenia",
      });
    }

    setActionLoading(null);
  }

    async function handleReject(invite: Invite) {
    setActionLoading(invite.id);
    setAlert(null);

    const res = await fetch("/api/friends", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        friendId: invite.user.id,
        mode: "invite",
      }),
    });

    if (res.ok) {
      setAlert({
        type: "info",
        title: "Zaproszenie odrzucone",
      });
      await fetchInvites();
      onAction();
    } else {
      setAlert({
        type: "error",
        title: "Błąd",
        description: "Nie udało się odrzucić zaproszenia",
      });
    }

    setActionLoading(null);
  }

  if (loading) return null;

  if (invites.length === 0) return null;

  return (
    <div className="mt-6 bg-white rounded-[2rem] p-6 shadow-xl border border-blue-50">
      <h3 className="text-sm font-black uppercase tracking-widest text-blue-300 mb-4">
        Zaproszenia do znajomych
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
                disabled={actionLoading === invite.id}
                onClick={() => handleAccept(invite)}
                className="px-3 py-2 text-xs font-black rounded-lg
                           bg-green-100 text-green-700
                           hover:bg-green-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Akceptuj
              </button>

              <button
                disabled={actionLoading === invite.id}
                onClick={() => handleReject(invite)}
                className="px-3 py-2 text-xs font-black rounded-lg
                           bg-red-100 text-red-600
                           hover:bg-red-200
                           disabled:opacity-50 disabled:cursor-not-allowed"
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


