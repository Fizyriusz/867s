import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Upewnij się, że ta ścieżka pasuje do Twojej struktury folderów
// Jeśli folder context jest w app/context, to ta ścieżka jest OK:
import { LanguageProvider } from '@/app/context/LanguageContext'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "867's HQ",
  description: "Centrum dowodzenia",
};

// 👇 TUTAJ BYŁ BŁĄD. Musi być "export default function"
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}