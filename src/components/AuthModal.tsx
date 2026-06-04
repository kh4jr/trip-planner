'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: Props) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLoginMode) {
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Nieprawidłowy email lub hasło');
      } else {
        onClose();
        window.location.reload();
      }
    } else {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await res.json();
        if (res.ok) {
          setIsLoginMode(true);
          alert("Konto utworzone! Możesz się zalogować.");
        } else {
          setError(data.message || 'Błąd rejestracji');
        }
      } catch (err) {
        setError('Błąd połączenia z serwerem');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        
        <div className="bg-blue-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">
            {isLoginMode ? "Witaj ponownie!" : "Stwórz konto"}
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            {isLoginMode ? "Zaloguj się, aby zarządzać podróżami" : "Dołącz do planowania wyjazdów"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && <p className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded-lg">{error}</p>}

          {!isLoginMode && (
            <div className="space-y-1 text-left">
              <label className="text-sm font-semibold text-gray-700 ml-1">Imię</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 text-gray-900"
              />
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-sm font-semibold text-gray-700 ml-1">Adres e-mail</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 text-gray-900"
            />
          </div>

          <div className="space-y-1 text-left">
            <label className="text-sm font-semibold text-gray-700 ml-1">Hasło</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 text-gray-900"
            />
          </div>

          <div className="pt-2 space-y-3">
            <button 
              type="submit"
              disabled={loading}
              className={`w-full ${isLoginMode ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50`}
            >
              {loading ? "Przetwarzanie..." : isLoginMode ? "Zaloguj się" : "Zarejestruj się"}
            </button>
            <button type="button" onClick={onClose} className="w-full text-gray-400 text-sm hover:text-gray-600">
              Anuluj
            </button>
          </div>
        </form>

        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {isLoginMode ? "Nie masz konta?" : "Masz już konto?"} 
            <button 
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)} 
              className="text-blue-600 font-bold hover:underline ml-1"
            >
              {isLoginMode ? "Zarejestruj się" : "Zaloguj się"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}