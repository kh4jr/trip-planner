'use client';
import { db } from '@/lib/db';
import './globals.css'; 
import Providers from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className="min-h-screen w-full">
        {/* OPATULAMY CAŁĄ APLIKACJĘ W PROVIDERS */}
        <Providers> 
          {children}
        </Providers>
      </body>
    </html>
  );
}