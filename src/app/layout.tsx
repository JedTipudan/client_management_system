import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import SettingsProvider from "../components/SettingsProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WiFi Manager",
  description: "Client Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SettingsProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-8">
              {children}
            </main>
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}