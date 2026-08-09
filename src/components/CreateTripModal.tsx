"use client";

import { SetStateAction, useState, Dispatch, useEffect } from "react";
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
  selectedIds,
  setSelectedIds,
}: CreateTripModalProps) {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [friends, setFriends] = useState<{ id: number; name: string | null; email: string }[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingFriends(true);
      fetch("/api/friends")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setFriends(data);
          }
        })
        .catch((err) => console.error("Error loading friends:", err))
        .finally(() => setLoadingFriends(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleParticipant = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const getMinEndDate = (start: string) => {
    if (!start) return "";
    const [year, month, day] = start.split("-").map(Number);
    const startDateObj = new Date(year, month - 1, day);
    startDateObj.setDate(startDateObj.getDate() + 1);
    
    const yyyy = startDateObj.getFullYear();
    const mm = String(startDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(startDateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const validateDates = (start: string, end: string) => {
    if (!start || !end) {
      setErrorMsg("");
      return true;
    }
    const minEnd = getMinEndDate(start);
    if (end < minEnd) {
      setErrorMsg("Koniec wyjazdu musi być przynajmniej o jeden dzień późniejszy niż start.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    validateDates(val, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndDate(val);
    validateDates(startDate, val);
  };

  const handleClose = () => {
    setStartDate("");
    setEndDate("");
    setErrorMsg("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateDates(startDate, endDate)) {
      return;
    }
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const startDateRaw = startDate;
    const endDateRaw = endDate;

    if (!startDateRaw || !endDateRaw) {
      alert("Proszę wybrać datę rozpoczęcia i zakończenia.");
      setLoading(false);
      return;
    }

    const tripData = {
      name: formData.get("name"),
      location: formData.get("destination"),
      destination: formData.get("location"), 

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
        throw new Error(errorData.details || errorData.error || "Błąd serwera");
      }

      const newTrip = await res.json();

      setSelectedIds([]);
      setStartDate("");
      setEndDate("");
      setErrorMsg("");
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
            placeholder="Miejsce docelowe"
            required
            className="w-full p-4 bg-blue-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-blue-900 placeholder:text-blue-300"
          />
          <input
            name="destination"
            placeholder="Miejsce startu"
            required
            className="w-full p-4 bg-blue-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-blue-900 placeholder:text-blue-300"
          />

          <div className="space-y-2">
            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-2">
              Zabierz ekipę ({selectedIds.length})
            </label>

            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
              {loadingFriends ? (
                <span className="text-xs text-slate-400 italic">Ładowanie znajomych...</span>
              ) : friends.length > 0 ? (
                friends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleParticipant(friend.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedIds.includes(friend.id)
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-blue-50 text-blue-400 hover:bg-blue-100"
                    }`}
                  >
                    {friend.name ?? friend.email}
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Brak znajomych</span>
              )}
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
                value={startDate}
                onChange={handleStartDateChange}
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
                value={endDate}
                onChange={handleEndDateChange}
                min={getMinEndDate(startDate)}
                className="w-full p-3 bg-blue-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-bold text-blue-900"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-red-500 text-xs font-bold mt-2 ml-2">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-4 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase text-xs tracking-widest"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading || !!errorMsg}
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
