import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import SettingsProvider from "../components/SettingsProvider";

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: "Brylle's Network & Data Solutions",
  description: "Client Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <SettingsProvider>
          <div className="flex min-h-screen relative">
            <Sidebar />
            <main className="flex-1 p-4 md:p-8 w-full md:ml-0 relative z-10">
              {/* Background Logo - Transparent */}
              <div 
                className="fixed inset-0 pointer-events-none opacity-10 flex items-center justify-center z-0"
                style={{
                  backgroundImage: "url('/logo.png')",
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              />
              <div className="relative z-10">
                {children}
              </div>
            </main>
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}