import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Audio Lab', // Changed from Audio Forge
  description: 'Forge your sound with powerful audio processing tools.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`font-sans bg-background text-foreground`}> {/* Added bg-background and text-foreground for base styling */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
