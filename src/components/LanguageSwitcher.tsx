"use client";

import { useLanguage } from "@/components/LanguageContext";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-inner relative w-24 h-10 items-stretch">
      <button
        onClick={() => setLanguage("pl")}
        className={`flex-1 flex items-center justify-center gap-1 text-xs font-black rounded-lg transition-all duration-300 relative z-10 ${
          language === "pl"
            ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 shadow-sm"
            : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
        }`}
      >
        PL 🇵🇱
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`flex-1 flex items-center justify-center gap-1 text-xs font-black rounded-lg transition-all duration-300 relative z-10 ${
          language === "en"
            ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 shadow-sm"
            : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"
        }`}
      >
        EN 🇬🇧
      </button>
    </div>
  );
}
