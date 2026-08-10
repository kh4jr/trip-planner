'use client';

import { SessionProvider } from 'next-auth/react'; 
import { ThemeProvider } from 'next-themes';
import { LanguageProvider } from '@/components/LanguageContext';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider> 
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}