import { AppHeader } from '@/components/audio-forge/AppHeader';
import { AppFooter } from '@/components/audio-forge/AppFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function FAQPage() {
  const faqs = [
    // General
    {
      question: "What is Audio Lab?",
      answer: "Audio Lab is a browser-based audio processing suite with a variety of tools to manipulate and enhance your audio files for free."
    },
    {
      question: "Is Audio Lab free to use?",
      answer: "Yes, Audio Lab is completely free. All processing is done client-side in your browser."
    },
    {
      question: "What audio file formats are supported?",
      answer: "Audio Lab supports MP3, WAV, WebM, OGG, FLAC, AAC, and M4A formats."
    },
    {
    question: "Do I need to install any software?",
      answer: "No, Audio Lab is a web application and runs entirely in your browser. No installation is required."
    },
    {
      question: "Is my audio uploaded to a server?",
      answer: "No, for most effects, all audio processing is done locally in your browser. Your audio files are not uploaded to any server for the core effects application."
    },
    {
      question: "How do I save my processed audio?",
      answer: "You can save your processed audio using the 'Export Configuration' panel. Choose your desired format and quality, and then click the 'Export Audio' button to download the file."
    },
    {
        question: "Why can't I hear a difference with some effects?",
        answer: "Some effects are subtle or depend heavily on the source audio. For example, a stereo widener won't have a noticeable effect on a mono track. Ensure your audio has the characteristics the effect is designed to work with (e.g., bass frequencies for a bass booster). Also, ensure your listening equipment (headphones/speakers) can reproduce the frequencies being affected."
    },  
    // Tool FAQs (one per tool from effects.ts, add more Q&A if desired)
    {
      question: "What does the Lo-fi effect do?",
      answer: "Lo-fi applies a slowed and reverb effect to your audio, creating chill, vintage soundscapes."
    },
    {
      question: "How does the 8D Audio Converter work?",
      answer: "It uses panning and reverb to create an immersive 8D effect, making sound appear to move around your head. Use headphones for best results."
    },
    {
      question: "What is Tune to 432Hz?",
      answer: "This tool converts music from standard 440Hz tuning to 432Hz for a warmer sound."
    },
    {
      question: "What is Resonance Alteration?",
      answer: "It lets you shift the frequency of your audio, changing how high or low it sounds."
    },
    {
      question: "How can I change audio speed without affecting pitch?",
      answer: "Use the Temporal Modification tool to speed up or slow down your audio while maintaining pitch."
    },
    {
      question: "What does Stereo Widener do?",
      answer: "Stereo Widener increases the stereo width of your audio, making it sound fuller and more spacious."
    },
    {
      question: "What is Automated Sweep?",
      answer: "Automated Sweep automatically pans your audio from left to right, creating dynamic movement."
    },
    {
      question: "How do I boost bass in my audio?",
      answer: "Use the Subharmonic Intensifier or Bass Booster Presets to enhance bass and sub-bass frequencies."
    },
    {
      question: "How does Frequency Sculptor (equalizer) work?",
      answer: "Frequency Sculptor lets you fine-tune bass, mid, and treble frequencies using a 3-band equalizer."
    },
    {
      question: "How can I transpose the key of my audio?",
      answer: "Use the Key Transposer to shift your audio up or down in semitones."
    },
    {
      question: "What is Pace Adjuster?",
      answer: "Pace Adjuster changes the tempo of your audio without altering its pitch."
    },
    {
      question: "How do I add echo to my track?",
      answer: "Use the Echo Generator to add customizable echo and delay effects."
    },
    {
      question: "Can I play audio in reverse?",
      answer: "Yes, use the Reverse Playback tool for experimental or creative reverse effects."
    },
    {
      question: "How do I adjust audio volume?",
      answer: "The Gain Controller lets you increase or decrease your audio's volume precisely."
    },
    {
      question: "How do I cut or trim audio?",
      answer: "Use the Audio Splitter to select start and end times and extract sections from your audio."
    },
    {
      question: "Can Audio Lab detect the BPM of a song?",
      answer: "Yes, the Rhythm Detector analyzes your audio and detects its beats per minute (BPM)."
    },
    {
      question: "What are Bass Booster Presets?",
      answer: "Bass Booster offers multiple preset intensities to quickly boost low frequencies."
    },
    {
      question: "What are Reverb Presets?",
      answer: "Reverb Presets simulate real acoustic spaces such as vocal ambience, rooms, halls, and cathedrals."
    },
  ];

  // Generate the JSON-LD object for FAQPage rich snippet
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      {/* FAQPage Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Audio Lab
            </Button>
          </Link>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-primary">Frequently Asked Questions (FAQ)</CardTitle>
            <CardDescription>Find answers to common and tool-specific questions about Audio Lab.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                <h3 className="text-xl font-semibold text-foreground mb-2">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
