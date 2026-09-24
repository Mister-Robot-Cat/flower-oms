import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import TopNav from "./ui/TopNav";

const clother = Inter({
  variable: "--font-clother",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "COSMIC - Premium Sifariş Sistemi",
  description: "Daxili sifariş və anbar idarəetmə sistemi",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body
        className={`${clother.variable} font-clother antialiased bg-gradient-to-br from-[#F3F1F2] to-[#E8D5E8] relative overflow-x-hidden min-h-screen`}
      >
        {/* Background Pattern */}
        <div 
          className="fixed inset-0 opacity-20 pointer-events-none" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236E1075' fill-opacity='0.08'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        <div className="relative z-10 min-h-screen flex flex-col">
          <Providers>
            <TopNav />
            <main className="flex-1">
              {children}
            </main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
