'use client';
import './globals.css'; 
import Providers from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        {
        /* OPATULAMY CAŁĄ APLIKACJĘ W PROVIDERS */}
        <Providers> 
          {children}
        </Providers>
      </body>
    </html>
  );
}