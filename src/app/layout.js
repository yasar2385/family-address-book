import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../app/page.module.css"



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Family Address Book',
  description: 'Manage your family connections',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-blue-600 text-white py-4 px-6 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">Address Book</h1>
              <nav>
                <ul className="flex space-x-4">
                  <li>
                    <a href="/" className="hover:underline">Home</a>
                  </li>
                  <li>
                    <a href="/dashboard" className="hover:underline">Dashboard</a>
                  </li>
                  <li>
                    <a href="/contact" className="hover:underline">Contact</a>
                  </li>
                </ul>
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-grow container mx-auto py-6 px-4">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white py-4">
            <div className="container mx-auto text-center">
              <p>&copy; {new Date().getFullYear()} My App. All Rights Reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
