import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({ subsets: ["latin"] });

export const metadata = {
  title: "Skillo | AI Personal Tutor",
  description: "A personal tutor for every child in India.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark text-white">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#c9a84c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Skillo" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={instrumentSans.className}>
        <main className="min-h-screen bg-[#0f0e0d] text-[#e8e2d9] selection:bg-[#c9a84c] selection:text-black">
          {children}
        </main>
      </body>
    </html>
  );
}
