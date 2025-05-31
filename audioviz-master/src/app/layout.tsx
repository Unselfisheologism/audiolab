import type { Metadata } from 'next';
// import { Open_Sans } from 'next/font/google'; // Removed
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// const openSans = Open_Sans({ // Removed
//   subsets: ['latin'],
//   variable: '--font-open-sans',
// });

export const metadata: Metadata = {
  title: 'AudioViz Studio',
  description: 'Create stunning audio visualizations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* <body className={`${openSans.variable} font-sans antialiased`}> // Modified */}
      <body className={`font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
