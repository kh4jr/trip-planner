// src/components/AuthButton.tsx

"use client"; // Komponent musi być klientem, aby używać hooków

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import AuthModal from './AuthModal';

export default function AuthButton() {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        <p className="text-white">
          Witaj, {session.user?.name || 'Użytkowniku'}!
        </p>

        <button
          onClick={() => signOut()}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
        >
          Wyloguj
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded"
      >
        Zaloguj się
      </button>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}