
import { AppHeader } from '@/components/audio-forge/AppHeader';
import { AppFooter } from '@/components/audio-forge/AppFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function FAQPage() {
  const faqs = [
    {
      question: "What is Audio Lab?",
      answer: "Audio Lab is a browser-based audio processing suite designed for musicians, sound designers, and audio enthusiasts. It offers a variety of tools to manipulate and enhance audio files directly in your web browser."
    },
    {
      question: "Is Audio Lab free to use?",
      answer: "Yes, Audio Lab is currently free to use for demonstration and educational purposes. All processing is done client-side in your browser."
    },
    {
      question: "What audio file formats are supported?",
      answer: "Audio Lab supports common audio formats like MP3, WAV, WebM, OGG, FLAC, AAC, and M4A. Performance may vary with very large files."
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
    {
        question: "What is 8D Audio?",
        answer: "8D Audio is a perceptual effect created by combining panning and reverb to simulate sound moving around the listener. It's best experienced with headphones. Its effectiveness can be subjective."
    },
    {
        question: "What does 'Tune to 432Hz' do?",
        answer: "This feature alters the pitch of a track from the standard A4=440Hz tuning to A4=432Hz. The perceived benefits of 432Hz tuning are a subject of ongoing discussion in the music community."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
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
            <CardDescription>Find answers to common questions about Audio Lab.</CardDescription>
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
