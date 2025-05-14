import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from "@/components/ui/provider"
import { PrismaProvider } from "@/components/providers/prisma-provider"

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-ibm-plex-sans',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ["latin"],
  variable: '--font-ibm-plex-mono',
});

export const metadata: Metadata = {
  title: "Roots - Find Your Next Home",
  description: "Find your next home with Roots",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} font-sans antialiased bg-white`}
      >
        <Provider>
          <PrismaProvider>
            {children}
          </PrismaProvider>
        </Provider>
      </body>
    </html>
  );
}
