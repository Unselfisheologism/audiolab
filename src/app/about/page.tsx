import React from 'react';
import { AppHeader } from '@/components/audio-forge/AppHeader';
import { AppFooter } from '@/components/audio-forge/AppFooter';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AboutUsPage: React.FC = () => {
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
            <CardTitle className="text-3xl font-bold text-primary">
              About Us:{' '}
              <a href="https://audiolab.in.net" className="hover:underline">The Best Free Online Audio Editor for Bass Boost, Reverb & 8D Effects</a>
              </CardTitle>
            <CardDescription>Welcome to Audiolab , the best free online audio editor designed for creators, musicians, and podcasters who want to enhance their audio effortlessly. Our platform combines powerful tools like bass booster , reverb effects , 8D sound FX , and more into one user-friendly interface.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 prose dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold">Why Choose Audiolab?</h2>
            <p><h3>Free Audio Editor Online : Edit, mix, and enhance audio files directly in your browser—no downloads required .</h3></p>
            <p><h3>Bass Booster & Equalizer : Add depth to your tracks with our bass booster and fine-tune frequencies with our audio equalizer .</h3></p>
            <p><h3>8D Sound FX : Transform your music into immersive 8D audio for a cinematic listening experience.</h3></p>
            <p><h3>Reverb & Echo Effects : Add studio-quality reverb or echo to vocals, podcasts, or music tracks.</h3></p>
            <p><h3>Sound Enhancer : Improve clarity and volume with tools like volume booster , sound quality enhancer , and audio louder .</h3></p>
            <h2 className="text-xl font-semibold">Key Features</h2>
            <p><h3>Audio Editor Browser-Based : Access our free online audio editor anytime, anywhere. No software installation needed.</h3></p>
            <p><h3>MP3 Audio File Editor : Trim, split, merge, and apply effects to MP3, WAV, and other popular formats.</h3></p>
            <p><h3>Online Audio Player : Preview your edits instantly with our built-in player.</h3></p>
            <p><h3>Download Sound FX : Use our library of sound effects to spice up your projects.</h3></p>
            <p><h3>Speed Up Audio : Adjust playback speed without compromising quality.</h3></p>
            <h2 className="text-xl font-semibold">Who Uses Audiolab?</h2>
            <p><h3>Musicians : Enhance tracks with bass sound , 8D effects , and reverb vocal .</h3></p>
            <p><h3>Podcasters : Clean up recordings with noise reduction and voice editor tools.</h3></p>
            <p><h3>Content Creators : Add sound effects , adjust audio volume , and create dynamic mixes.</h3></p>
            <p><h3>Gamers & Streamers : Boost game audio with sound amplifier and bass booster PC tools.</h3></p>
            <h2 className="text-xl font-semibold">Our Mission</h2>
            <p><h3>At Audiolab, we believe free audio editor online tools should be accessible, intuitive, and powerful. Whether you’re a beginner or a pro, our platform empowers you to:</h3></p>
            <p><h3>Edit sound files like a pro with minimal effort.</h3></p>
            <p><h3>Create audio that stands out with best sound enhancer effects.</h3></p>
            <p><h3>Convert sound files to different formats effortlessly.</h3></p>
            <h2 className="text-xl font-semibold">Join Millions of Usersz</h2>
            <p><h3>Trusted by over 10,000+ creators monthly, Audiolab is ranked among the top free audio editors for its simplicity and robust feature set. Start editing today with our free audio online editor !</h3></p>
          </CardContent>
        </Card>
        <h1 className="text-3xl font-bold text-primary mt-8"><a href="https://audiolab.in.net" className="hover:underline">Start Editing Now:</a></h1>
        <p><h3>Ready to transform your audio? Try Audiolab’s free audio editor online —it’s fast, free, and perfect for every project.</h3></p>
      </main>
      <AppFooter />
    </div>
  );
};

export default AboutUsPage;