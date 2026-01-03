// src/components/AuthButton.tsx

"use client"; // Komponent musi być klientem, aby używać hooków

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  // useSession sprawdza status logowania
  const { data: session } = useSession();

  if (session) {
    // Użytkownik ZALOGOWANY
    return (
      <div className="flex items-center space-x-4">
        <p className="text-white">Witaj, {session.user?.name || "Użytkowniku"}!</p>
        <button
          onClick={() => signOut()}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
        >
          Wyloguj
        </button>
      </div>
    );
  }

  // Użytkownik NIEZALOGOWANY
  return (
    <button
      onClick={() => signIn()}
      className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded"
    >
      Zaloguj się
    </button>
  );
}