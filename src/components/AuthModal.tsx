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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        
        {/* NAGŁÓWEK Z KOLOREM */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Witaj ponownie!</h2>
          <p className="text-blue-100 text-sm mt-1">Zaloguj się, aby zarządzać swoimi podróżami</p>
        </div>

        <div className="p-8 space-y-5">
          {/* POLE EMAIL */}
          <div className="space-y-1 text-left">
            <label className="text-sm font-semibold text-gray-700 ml-1">Adres e-mail</label>
            <input 
              type="email" 
              placeholder="np. jan@kowalski.pl"
              className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>

          {/* POLE HASŁO */}
          <div className="space-y-1 text-left">
            <label className="text-sm font-semibold text-gray-700 ml-1">Hasło</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>

          {/* PRZYCISKI AKCJI */}
          <div className="pt-2 space-y-3">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95">
              Zaloguj się
            </button>
            <button 
              onClick={onClose}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-500 font-semibold py-3 rounded-xl transition-colors"
            >
              Anuluj
            </button>
          </div>
        </div>

        {/* STOPKA */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Nie masz konta? <button className="text-blue-600 font-bold hover:underline">Zarejestruj się</button>
          </p>
        </div>
      </div>
    </div>
  );
}
