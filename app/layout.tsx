import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from '@/app/context/LanguageContext'
import { AdminProvider } from '@/app/context/AdminContext' // <--- NOWY IMPORT

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "867's HQ",
  description: "Centrum dowodzenia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={inter.className}>
        <LanguageProvider>
          <AdminProvider> {/* <--- DODAJEMY ADMIN PROVIDER */}
            {children}
          </AdminProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}