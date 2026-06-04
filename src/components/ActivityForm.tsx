"use client";

import { useState } from "react";
import { Activity } from "@prisma/client";

interface ActivityFormProps {
  tripId: number;
  onSave: (activity: Activity) => void;
  onCancel: () => void;
}

export default function ActivityForm({
  tripId,
  onSave,
  onCancel,
}: ActivityFormProps) {
  const [name, setName] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !time) return;

    setLoading(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          time,
          tripId,
        }),
      });

      if (!res.ok) {
        throw new Error("Błąd zapisu aktywności");
      }

      const savedActivity: Activity = await res.json();
      onSave(savedActivity);
      setName("");
      setTime("");
    } catch (err) {
      console.error(err);
      alert("Nie udało się dodać aktywności");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border p-6 rounded-2xl bg-white shadow-sm"
    >
      <h3 className="text-xl font-black text-blue-900">
        Nowa aktywność
      </h3>

      <input
        className="w-full p-3 border rounded-xl text-black font-bold"
        placeholder="Co planujesz?"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        type="datetime-local"
        className="w-full p-3 border rounded-xl text-black font-bold"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        required
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black hover:bg-blue-700 transition"
        >
          Zapisz
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
