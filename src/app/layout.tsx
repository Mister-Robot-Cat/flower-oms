import type { Metadata } from "next";
import { Golos_Text, Unbounded } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import TopNav from "./ui/TopNav";

// Both families cover Azerbaijani letters (ə, ş, ğ, ı, İ) and Cyrillic.
const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flower OMS",
  description: "Gül mağazası üçün sifariş və anbar idarəetməsi",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#6E1075",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body className={`${golos.variable} ${unbounded.variable} font-sans antialiased min-h-screen`}>
        <div className="min-h-screen flex flex-col">
          <Providers>
            <TopNav />
            <main className="flex-1">{children}</main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
