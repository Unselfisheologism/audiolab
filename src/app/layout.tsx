import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Script from 'next/script';
import Head from 'next/head';
import Image from 'next/image';

export const metadata = {
  title: 'Edit Audio Online',
  description: 'Edit audio online for free: 8D Audio Converter, Bass Booster, Reverb, Equalizer, 432Hz tuning, Lo-fi & more. No signup. Export instantly.',
  keywords: [
    'audio editing software',
    'audio editing',
    'music composing software',
    'audio converter',
    'audio player',
    'rhythm detector',
    'audio analyzer',
    'audio gain controller',
    'audio key transposer',
    'bass booster',
    'audio presets',
    'Audacity alternative',
    'audioalter alternative',
    'audiolab alternative',
    'free audio editor',
    '8D audio',
    'white noise',
    'Lo-fi',
    'Slowed and reverb tool',
    'MP3 converter',
    'OGG converter',
    'FLAC converter',
    'WAV converter',
    'audio converter',
    'MP3 to OGG',
    'MP3 to FLAC',
    'MP3 to WAV',
    'OGG to MP3',
    'OGG to FLAC',
    'OGG to WAV',
    'FLAC to MP3',
    'FLAC to OGG',
    'FLAC to WAV',
    'WAV to MP3',
    'WAV to OGG',
    'WAV to FLAC'
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
            width={120}    // Use the actual badge width in pixels
            height={40}    // Use the actual badge height in pixels
            unoptimized
          />
        </a>
       </div>  
      <div className="badge-wrapper-130x40">
        <a href='https://www.sideprojectors.com/project/58769/audiolab' target="_blank" rel="noopener noreferrer">
          <Image
            src='https://www.sideprojectors.com/img/badges/badge_show_black.png'
            alt='Check out Audiolab at @SideProjectors'
            width={130}
            height={40}
            unoptimized
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
          />
        </a>
       </div> 
        
        {/* --- Add this block below badges, before {children} --- */}
       <div className="site-header-info" style={{textAlign: 'center', margin: '24px 0 10px 0'}}>
         <h1 className="text-3xl font-bold text-primary" style={{marginBottom: 10}}>
           Audio Lab: Free Online Audio Editor & Converter
         </h1>
         <p className="text-lg text-muted-foreground" style={{maxWidth: 600, margin: '0 auto'}}>
           Edit audio online for free. Audio Lab lets you convert, enhance, and fine-tune audio files with tools like 8D Audio Converter, Bass Booster, Noise Reduction, Equalizer, 432Hz Tuning, Lo-fi, and more. No signup required—export your music instantly!
         </p>
       </div>
       {/* --- End of block --- */} 
        
        {children}
        <Toaster />
      </body>
    </html>
  );
}
