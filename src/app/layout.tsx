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
      <div className={{sf-root}} data-id={{3877164}} data-badge={{oss-users-love-us-white}} style={{width:125px}}>
          <a href="https://sourceforge.net/projects/audiolab/" target="_blank">Audiolab</a>
      </div>
      <script>(function () {var sc=document.createElement('script');sc.async=true;sc.src='https://b.sf-syn.com/badge_js?sf_id=3877164';var p=document.getElementsByTagName('script')[0];p.parentNode.insertBefore(sc, p);})();
      </script>
        <a href="https://fazier.com" target="_blank"><img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=neutral" alt="Fazier badge" /></a>
        <a href="https://www.uneed.best/tool/audiolab">
          <img src="https://www.uneed.best/EMBED3.png" alt="Uneed Embed Badge" />
        </a>
        <a href='https://www.sideprojectors.com/project/58769/audiolab' alt='Check out Audiolab  at @SideProjectors'>
          <img src='https://www.sideprojectors.com/img/badges/badge_show_black.png' alt='Check out Audiolab at @SideProjectors' />
        </a>
        <a href='https://dang.ai/' target='_blank' >
          <img src='https://cdn.prod.website-files.com/63d8afd87da01fb58ea3fbcb/6487e2868c6c8f93b4828827_dang-badge.png' alt='Dang.ai' style='width: 150px; height: 54px;' width='150' height='54' />
        </a>  
        {children}
        <Toaster />
      </body>
    </html>
  );
}
