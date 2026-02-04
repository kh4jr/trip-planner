"use client";

import { SetStateAction, useState, Dispatch } from "react";
import { FullTrip } from "@/types/fullTrip";

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trip: FullTrip) => void;

  allPeople: {
    id: number;
    role: string;
    user: {
      id: number;
      name: string | null;
      email: string;
    };
  }[];

  selectedIds: number[];
  setSelectedIds: Dispatch<SetStateAction<number[]>>;
}

export default function CreateTripModal({
  isOpen,
  onClose,
  onSuccess,
  allPeople,
  selectedIds,
  setSelectedIds,
}: CreateTripModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleParticipant = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const startDateRaw = formData.get("startDate") as string;
    const endDateRaw = formData.get("endDate") as string;

    if (!startDateRaw || !endDateRaw) {
      alert("Proszę wybrać datę rozpoczęcia i zakończenia.");
      setLoading(false);
      return;
    }

    const tripData = {
      name: formData.get("name"),
      location: formData.get("location"),
      destination: formData.get("destination"),
      description: formData.get("description"),
      startDate: new Date(startDateRaw).toISOString(),
      endDate: new Date(endDateRaw).toISOString(),
      participantIds: selectedIds, 
    };

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Szczegóły błędu z serwera:", errorData);
        throw new Error(errorData.details || "Błąd serwera");
      }

      const newTrip = await res.json();

      setSelectedIds([]);
      onSuccess(newTrip);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Nieznany błąd";
      console.error("Error podczas zapisu:", message);
      alert(`Nie udało się utworzyć wyjazdu: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] p-8 w-full max-w-lg shadow-2xl border-4 border-blue-50">
        <h2 className="text-2xl font-black text-blue-900 mb-6 text-center">
          Planowanie wycieczki
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Nazwa wyjazdu"
            required
            className="w-full p-4 bg-blue-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-blue-900 placeholder:text-blue-300"
          />
          <input
            name="location"
            placeholder="Miejsce startu"
            required
            className="w-full p-4 bg-blue-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-blue-900 placeholder:text-blue-300"
          />
          <input
            name="destination"
            placeholder="Cel podróży"
            required
            className="w-full p-4 bg-blue-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-blue-900 placeholder:text-blue-300"
          />

          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">
              Zabierz ekipę ({selectedIds.length})
            </label>

            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {allPeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => toggleParticipant(person.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedIds.includes(person.id)
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-blue-50 text-blue-400 hover:bg-blue-100"
                  }`}
                >
                  {person.user.name ?? person.user.email}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">
                Start
              </label>
              <input
                name="startDate"
                type="date"
                required
                className="w-full p-3 bg-blue-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-blue-900"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">
                Koniec
              </label>
              <input
                name="endDate"
                type="date"
                required
                className="w-full p-3 bg-blue-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-blue-900"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase text-xs tracking-widest"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
            >
              {loading ? "Zapisuję..." : "Zapisz wyjazd"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
