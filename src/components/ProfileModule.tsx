"use client";

import { useEffect, useState } from "react";

export default function ProfileModule() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.email) {
          setName(data.name || "");
          setEmail(data.email);
        }
      })
      .catch((err) => console.error("Error loading profile:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password && password !== confirmPassword) {
      setMessage({ type: "error", text: "Hasła nie są identyczne." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          password: password || undefined,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profil zaktualizowany pomyślnie!" });
        setPassword("");
        setConfirmPassword("");
      } else {
        const errData = await res.json();
        setMessage({ type: "error", text: errData.error || "Błąd podczas zapisu." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Wystąpił błąd sieci." });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-blue-50 shadow-2xl shadow-blue-100/50 w-full min-h-[600px] text-left">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-200">
          👤
        </div>
        <div>
          <h2 className="text-2xl font-black text-blue-900 leading-tight">Mój Profil</h2>
          <p className="text-sm text-blue-300 font-bold">Zarządzaj swoimi danymi osobowymi</p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 mb-6 rounded-2xl text-sm font-bold border ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border-green-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-blue-900 uppercase tracking-widest block">
            Adres E-mail (Niezmienny)
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm text-slate-500 font-medium cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-blue-900 uppercase tracking-widest block">
            Imię i Nazwisko
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Wprowadź swoje imię"
            className="w-full border border-blue-50 hover:border-blue-100 focus:border-blue-500 bg-white p-4 rounded-xl text-sm font-bold text-blue-900 transition-all outline-none"
          />
        </div>

        <hr className="border-blue-50/50 my-6" />

        <div>
          <h3 className="text-sm font-black text-blue-900 uppercase tracking-wider mb-2">Zmiana Hasła</h3>
          <p className="text-xs text-slate-400 font-bold mb-4">
            Pozostaw puste, jeśli nie chcesz zmieniać hasła
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                Nowe Hasło
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-blue-50 hover:border-blue-100 focus:border-blue-500 bg-white p-4 rounded-xl text-sm font-bold text-blue-900 transition-all outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">
                Powtórz Hasło
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-blue-50 hover:border-blue-100 focus:border-blue-500 bg-white p-4 rounded-xl text-sm font-bold text-blue-900 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 transition-all active:scale-98 disabled:opacity-50"
        >
          {loading ? "Zapisywanie..." : "Zapisz Zmiany"}
        </button>
      </form>
    </div>
  );
}
