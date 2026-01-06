'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {
      redirect: false,
      login,
      password,
    });

    if (result?.error) {
      setError('Nieprawidłowy login lub hasło');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[320px]">
        <h2 className="text-xl font-bold mb-4">Logowanie</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Login"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />

          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Zaloguj
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:underline"
            >
              Anuluj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
