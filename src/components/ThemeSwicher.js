"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";


const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme(); // Teraz ten wiersz zadziała

  // Zapewnia poprawne renderowanie po stronie klienta (hydratacja)
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // Nie renderuj na serwerze, aby uniknąć błędów

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-full hover:bg-white/20 transition-colors" // Opcjonalne style Tailwind
      aria-label="Toggle dark mode"
    >
      {}
      {theme === 'light' ? '🌙 Ciemny' : '☀️ Jasny'}
    </button>
  );
};

export default ThemeSwitcher;