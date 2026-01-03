'use client';

import { SessionProvider } from 'next-auth/react'; 
import { ThemeProvider } from 'next-themes';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // 1. Dodaj SessionProvider
    <SessionProvider> 
      {/* 2. Owiń SessionProvider w ThemeProvider (lub na odwrót - kolejność nie ma znaczenia) */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}