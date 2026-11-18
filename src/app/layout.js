import { Bricolage_Grotesque, Hanken_Grotesk, IBM_Plex_Mono, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth/AuthProvider";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap"
});

const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600"],
  variable: "--font-tamil",
  display: "swap"
});

export const metadata = {
  title: "Kudumbam · Family Register",
  description: "A private register of the family — names, homes and how everyone is related."
};

export const viewport = {
  themeColor: "#E6E8DF"
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} ${tamil.variable}`}
    >
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
