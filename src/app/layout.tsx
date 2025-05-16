import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Advanced Audio Tools & Presets for Slowed and Reverb, Pitch, Bass Boost, 8D Effects, Lofi | Audiolab Create, Convert, and Enhance Audio Files Online with Free Reverb Presets, Vocal Removal, Tempo Detection, and More!', // Changed from Audio Forge
  description: 'Unlock professional-grade audio editing with our free online tools. Apply reverb presets, bass booster effects, pitch shifting, 8D audio, and vocal removal. Optimize tracks with EQ, noise reduction, stereo enhancement, and room-size adjustments. Perfect for music producers, podcasters, and content creators!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`font-sans bg-background text-foreground`}> {/* Added bg-background and text-foreground for base styling */}
        <a href="https://affordhunt.com" target="_blank" rel="noopener noreferrer">
          <img src="https://svgshare.com/i/xLe.svg" title="Top Pick By AffordHunt" />
        </a>
        <a href="https://fazier.com" target="_blank"><img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=neutral" alt="Fazier badge" /></a>
        <a href="https://affordhunt.com" target="_blank" rel="noopener noreferrer">
          <img src="https://svgshare.com/i/xLe.svg" title="Top Pick By AffordHunt" />
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
