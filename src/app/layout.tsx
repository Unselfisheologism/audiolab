import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Script from 'next/script';
import Head from 'next/head';
import Image from 'next/image';
import { useEffect, useRef } from 'react';
import AutoScrollingCarousel from "@/components/AutoScrollingCarousel";
import Link from 'next/link';
// import { AppHeader } from '@/components/audio-forge/AppHeader'; // Uncomment if you want the header

export const metadata = {
  title: 'Free Audio Editor | Bass Booster, 8D Sound FX & Convert Tools',
  description: 'Free Audio Editor Online: Bass Booster, 8D Sound FX & Convert Tools. Edit, enhance, and transform audio files effortlessly with powerful effects for music, podcasts, and videos. ',
  keywords: [
  "bass booster",  
  "8d audio",  
  "sound fx",  
  "audio editor",  
  "audio audio editor",  
  "convert sound file",  
  "mp3 audio file editor",  
  "song editor",  
  "audio download",  
  "3d audio",  
  "3d audio effect",  
  "download sound fx",  
  "sound booster",  
  "edit sound",  
  "music bass booster",  
  "extreme bass booster",  
  "audio files",  
  "speed up audio",  
  "audio en video",  
  "equalizer audio",  
  "audio editor online",  
  "music editor",  
  "audio eq",  
  "bass sound",  
  "eq audio equalizer",  
  "audio sound equalizer",  
  "online audio editing tools",  
  "maker sound",  
  "music editor online free",  
  "volume booster for windows",  
  "video and audio enhancer",  
  "short audio file",  
  "free equalizer app",  
  "audio quality enhancer",  
  "sound booster pc",  
  "audio enhancer app",  
  "equalizer pro",  
  "bass booster for car",  
  "volume enhancer",  
  "boost volume",  
  "audio booster for pc",  
  "music quality enhancer",  
  "earrape maker",  
  "audio bass",  
  "create audio file",  
  "free audio enhancer",  
  "equalizer fx",  
  "sound enhancer online",  
  "audio quality improver",  
  "mp3 audio equalizer",  
  "mp3 equalizer",  
  "improve sound quality",  
  "increase audio quality",  
  "make an audio file",  
  "increase music quality",  
  "improve music quality",  
  "sound quality improver",  
  "reverb audio effect",  
  "online audio player",  
  "edit wav online",  
  "ai song editor",  
  "fix audio in a video",  
  "audio tempo changer",  
  "free sound boost",  
  "audio effects online",  
  "voice editor online",  
  "add reverb to audio",  
  "add echo to audio",  
  "sound enhancer app",  
  "best bass booster app",  
  "sound amplifier for pc",  
  "audio file editor online",  
  "audio mixer online free",  
  "make music louder",  
  "vocal editor online",  
  "sound online",  
  "sound mixer online free",  
  "eq software for pc",  
  "install equalizer",  
  "audio file music",  
  "download free equalizer",  
  "music volume booster",  
  "audio mixer website",  
  "bass booster app for android",  
  "bass boosted converter",  
  "voice enhancer for video",  
  "better sound quality",  
  "add echo to sound",  
  "download speaker",  
  "sound file editor online",  
  "audio volume",  
  "more bass",  
  "best sound enhancer",  
  "android bass boost",  
  "eq download free",  
  "enhance audio quality online free",  
  "equalizer software for pc",  
  "make audio low quality",  
  "live equalizer",  
  "best bass booster",  
  "add audio",  
  "best app for bass booster",  
  "music player with equalizer",  
  "fx sound presets",  
  "voice slower",  
  "free online audio editing tool",  
  "better audio quality",  
  "edit audio clips online",  
  "free audio online editor",  
  "bass boost chrome",  
  "graphic sound equalizer",  
  "car audio bass booster",  
  "free equalizer for windows 10",  
  "make audio clearer",  
  "audio editing software online",  
  "add music to audio",  
  "audio enhancement software",  
  "create audio",  
  "audio file maker",  
  "sound amplifier online",  
  "fx sound equalizer",  
  "pc sound enhancer",  
  "audio improvement software",  
  "change audio",  
  "audio manipulation online",  
  "music amplifier online",  
  "equalizer app for windows",  
  "ears audio toolkit",  
  "audio file volume booster",  
  "best equalizer settings for bass on android",  
  "speed up an audio file",  
  "equalizer mod apk",  
  "increase volume audio file",  
  "volume editor",  
  "edit mp3 volume",  
  "edit track",  
  "make a song louder",  
  "mp3 audio maker",  
  "audio editor browser",  
  "voice enhancer online",  
  "free equalizer for android",  
  "audio editing website",  
  "voice reverb",  
  "equalizer download for pc",  
  "add bass to audio",  
  "audio equalizer online free",  
  "audio muffler online",  
  "audio track editor",  
  "free bass booster app for android",  
  "audio file editor",  
  "audio to video",  
  "edit sound files",  
  "windows equalizer",  
  "eq for windows",  
  "equalizer settings",  
  "equalizer audio app",  
  "equalizer software windows",  
  "windows audio equalizer",  
  "equalizer headphone",  
  "eq apps",  
  "audio effects",  
  "bass booster app",  
  "volume booster pc",  
  "audio bass booster",  
  "enhance audio volume",  
  "reverse sound",  
  "audio for edit",  
  "sound for edit",  
  "music editor online",  
  "audio fx",  
  "audio files download",  
  "enhance audio",  
  "bass booster online",  
  "reverb effect",  
  "online equalizer",  
  "best eq",  
  "speaker equalizer",  
  "best equalizer",  
  "make audio louder",  
  "make sound",  
  "youtube music equalizer",
  ],
  alternates: {
    canonical: 'https://audiolab.in.net/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <meta name="google-site-verification" content="YeU0_IIP-PLuFSe1-WhZSFJLP30iNuUi89SKvusNUFM" />
      </head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Audio Lab",
            "url": "https://audiolab.in.net",
            "description": "Free online audio editor with tools like 8D Audio Converter, Lo-fi, 432Hz Tuning, Resonance Alteration, Tempo Change, Stereo Widener, Bass Booster, Equalizer, Reverb, and more.",
            "applicationCategory": "AudioEditor",
            "browserRequirements": "Requires JavaScript and a modern browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "hasPart": [
              {
                "@type": "SoftwareApplication",
                "name": "Lo-fi",
                "url": "https://audiolab.in.net/#dreamscapeMaker",
                "description": "Create lo-fi music with a slowed and reverb effect for chill, atmospheric soundscapes.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "8D Audio Converter",
                "url": "https://audiolab.in.net/#audio8DConverter",
                "description": "Transform any song or audio file into immersive 8D audio.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Tune to 432Hz",
                "url": "https://audiolab.in.net/#frequencyTuner432",
                "description": "Convert music from 440Hz to 432Hz for a warmer, more natural sound.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Resonance Alteration",
                "url": "https://audiolab.in.net/#resonanceAlteration",
                "description": "Shift the frequency of your audio with a pitch shifter.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Temporal Modification",
                "url": "https://audiolab.in.net/#temporalModification",
                "description": "Change the playback speed of audio without affecting pitch.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Stereo Widener",
                "url": "https://audiolab.in.net/#stereoWidener",
                "description": "Widen the stereo image of your audio for a fuller, more spacious sound.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Automated Sweep",
                "url": "https://audiolab.in.net/#automatedSweep",
                "description": "Pan audio from left to right automatically.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Subharmonic Intensifier",
                "url": "https://audiolab.in.net/#subharmonicIntensifier",
                "description": "Boost the bass and sub-bass frequencies in your audio.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Frequency Sculptor",
                "url": "https://audiolab.in.net/#frequencySculptor",
                "description": "Shape your sound with a 3-band equalizer (EQ).",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Key Transposer",
                "url": "https://audiolab.in.net/#keyTransposer",
                "description": "Transpose the key of your audio up or down in semitones.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Pace Adjuster",
                "url": "https://audiolab.in.net/#paceAdjuster",
                "description": "Adjust tempo without changing pitch.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Echo Generator",
                "url": "https://audiolab.in.net/#echoGenerator",
                "description": "Add customizable echo and delay effects to your audio.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Reverse Playback",
                "url": "https://audiolab.in.net/#reversePlayback",
                "description": "Play any audio file in reverse.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Gain Controller",
                "url": "https://audiolab.in.net/#gainController",
                "description": "Increase or decrease the volume of your audio with a precise gain control slider.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Audio Splitter",
                "url": "https://audiolab.in.net/#audioSplitter",
                "description": "Cut and extract sections from your audio by selecting start and end times.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Rhythm Detector",
                "url": "https://audiolab.in.net/#rhythmDetector",
                "description": "Detect and analyze the BPM (beats per minute) of any audio file.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Bass Booster Presets",
                "url": "https://audiolab.in.net/#bassBoosterPresets",
                "description": "Choose from a range of bass booster presets to enhance low frequencies: subtle, gentle, medium, intense, or maximum bass.",
                "operatingSystem": "All"
              },
              {
                "@type": "SoftwareApplication",
                "name": "Reverb Presets",
                "url": "https://audiolab.in.net/#reverbPresets",
                "description": "Simulate real acoustic spaces with reverb presets: vocal ambience, washroom, small room, medium room, large room, chapel hall, or cathedral.",
                "operatingSystem": "All"
               }
             ]
          })
        }}
      />
      <body className="font-sans bg-background text-foreground">
        {/* Uncomment this line if using AppHeader */}
        {/* <AppHeader /> */}

        {/* BADGES */}
        <div className="badge-wrapper-270x54">   
          <a 
            href="https://fazier.com/launches/audiolab" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <img 
              src="https://fazier.com/api/v1/public/badges/embed_image.svg?launch_id=4421&badge_type=daily&theme=light" 
              width={270} 
              alt="Fazier badge" 
              unoptimized
            />
          </a>
        </div>  
        <div
          className="sf-root badge-wrapper-125x40"
          data-id="3877688"
          data-badge="oss-users-love-us-black"
        >
          <a href="https://sourceforge.net/projects/audiolab/" target="_blank" rel="noopener noreferrer">
            Audiolab
          </a>
        </div>
        <Script id="sf-badge" strategy="afterInteractive">
          {`(function () {
            var sc = document.createElement('script');
            sc.async = true;
            sc.src = 'https://b.sf-syn.com/badge_js?sf_id=3877688';
            var p = document.getElementsByTagName('script')[0];
            p.parentNode.insertBefore(sc, p);
          })();`}
        </Script>
        <div className="badge-wrapper-250x54">
          <a
            href="https://www.producthunt.com/posts/audiolab-2?embed=true&utm_source=badge-featured&utm_medium=badge"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=966661&theme=light&t=1747473927338"
              alt="Audiolab: Audio Editing Without the Headache | Product Hunt"
              style={{ width: 250, height: 54 }}
              width={250}
              height={54}
              unoptimized
            />
          </a>
        </div> 
        <div className="badge-wrapper-120x40">
          <a href="https://www.uneed.best/tool/audiolab">
            <Image
              src="https://www.uneed.best/EMBED3.png"
              alt="Uneed Embed Badge"
              width={120}
              height={40}
              unoptimized
              loading="eager"
            />
          </a>
        </div>  
        <div className="badge-wrapper-130x40">
          <a href='https://res.cloudinary.com/ddz3nsnq1/image/upload/v1747986022/side_cloud_y0rtcq.png' target="_blank" rel="noopener noreferrer">
            <Image
              src='https://www.sideprojectors.com/img/badges/badge_show_black.png'
              alt='Check out Audiolab at @SideProjectors'
              width={130}
              height={40}
              unoptimized
              loading="eager"
            />
          </a>
        </div>  
        <div className="badge-wrapper-150x54">  
          <a href='https://dang.ai/' target='_blank' rel="noopener noreferrer">
            <Image
              src='https://cdn.prod.website-files.com/63d8afd87da01fb58ea3fbcb/6487e2868c6c8f93b4828827_dang-badge.png'
              alt='Dang.ai'
              width={150}
              height={54}
              unoptimized
              loading="eager"
            />
          </a>
        </div> 
        <div className="badge-wrapper-250x54"> 
          <a
            href="https://www.producthunt.com/products/audiolab-2/reviews?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-audiolab-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1066251&theme=light"
              alt="Audiolab: Audio Editing Without the Headache | Product Hunt"
              width={250}
              height={54}
              unoptimized
              loading="eager"
            />
          </a>
        </div>  

          {/* Title+Description */}
          <section className="flex flex-col flex-[2_1_320px] items-center justify-center mx-auto max-w-2xl text-center bg-transparent p-2">
            <h1 className="text-3xl font-bold text-primary mb-2">Audio Lab: Free Online Audio Editor & Converter</h1>
            <p className="text-lg text-muted-foreground mb-2">
              Edit audio online for free. Audio Lab lets you convert, enhance, and fine-tune audio files with tools like 8D Audio Converter, Bass Booster, Noise Reduction, Equalizer, 432Hz Tuning, Lo-fi, and more. No signup required—export your music instantly!
            </p>
          </section>
  
       {/* === CAROUSEL === */}
        <AutoScrollingCarousel />

        {/* === MAIN CONTENT === */}      

        {children}
        <Toaster />
      </body>
    </html>
  );
}
