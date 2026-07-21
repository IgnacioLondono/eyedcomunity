import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "EyedComun",
    template: "%s · EyedComun",
  },
  description: "Tus estadísticas, momentos y comunidad de Eyed en un solo lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geist.variable} ${mono.variable}`}>
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        {children}
      </body>
    </html>
  );
}
