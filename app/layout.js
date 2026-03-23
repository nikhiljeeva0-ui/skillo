import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap"
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

export const metadata = {
  title: "Skillo | AI Personal Tutor",
  description: "AI that remembers how YOU learn. Adapts every session. Free for every student in India.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${jakarta.variable} ${inter.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f5a623" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Skillo" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className} style={{ fontFamily: "var(--font-body, 'Inter', sans-serif)" }}>
        <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent)] selection:text-black">
          {children}
        </main>
      </body>
    </html>
  );
}
