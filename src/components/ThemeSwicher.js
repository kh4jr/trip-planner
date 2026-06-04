"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";


const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme(); 

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; 

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-full hover:bg-white/20 transition-colors" 
      aria-label="Toggle dark mode"
    >
      {}
      {theme === 'light' ? '🌙 Ciemny' : '☀️ Jasny'}
    </button>
  );
};

export default ThemeSwitcher;