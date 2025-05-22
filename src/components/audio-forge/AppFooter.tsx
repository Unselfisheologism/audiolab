import { LegalLinks } from './LegalLinks';
import { Separator } from '@/components/ui/separator';
import { FaYoutube, FaXTwitter, FaLinkedin, FaMedium, FaDiscord } from "react-icons/fa6";

export function AppFooter() {
  return (
    <footer className="bg-muted text-muted-foreground p-6 md:p-8 mt-auto w-full border-t">
      <div className="container mx-auto text-center">
        {/* Social Icons */}
        <div className="flex justify-center gap-4 mb-6">
          <a href="https://https://unselfishneologism/substack.com" target="_blank" rel="noopener noreferrer" title="Substack">
            <FaRegEnvelope className="text-gray-600 hover:text-orange-600 transition" size={28} aria-label="Substack" />
            <span className="text-sm font-medium mt-1">Tutorials</span>
          </a>
          <a href="https://www.youtube.com/@WhAtNOTif-r4h" target="_blank" rel="noopener noreferrer" title="YouTube">
            <FaYoutube className="text-gray-600 hover:text-red-600 transition" size={28} aria-label="YouTube" />
          </a>
          <a href="https://x.com/Jeff9James" target="_blank" rel="noopener noreferrer" title="X">
            <FaXTwitter className="text-gray-600 hover:text-black transition" size={28} aria-label="X" />
          </a>
          <a href="https://www.linkedin.com/in/jeffrin-jeffrin-6b4041345/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
            <FaLinkedin className="text-gray-600 hover:text-blue-700 transition" size={28} aria-label="LinkedIn" />
          </a>
          <a href="https://medium.com/@jeffrinjames99" target="_blank" rel="noopener noreferrer" title="Medium">
            <FaMedium className="text-gray-600 hover:text-green-700 transition" size={28} aria-label="Medium" />
          </a>
          <a href="https://discordapp.com/users/1293939031620456492" target="_blank" rel="noopener noreferrer" title="Discord">
            <FaDiscord className="text-gray-600 hover:text-indigo-600 transition" size={28} aria-label="Discord" />
          </a>
        </div>

        {/* Legal Links Section */}
        <LegalLinks />

        <Separator className="my-6 bg-border/50" />

        {/* Copyright and Disclaimers */}
        <div className="text-xs">
          <p>
            Audio Lab leverages open-source libraries and technologies like the Web Audio API to deliver an online audio toolkit with easy-to-use web tools.
            All processing occurs locally in your browser, ensuring your audio files remain private—no uploads to servers for reverb preset adjustments, bass booster preset enhancements, or 8D audio...
            This application serves demonstration and educational purposes, emphasizing responsible use of tools like pitch-shifted tracks, semitones-rounded tuning, and vocal tracks editing.
            Always back up original audio files before applying effects such as reverb effect simulations (e.g., cathedral, church hall, or small room presets), noise reduction for background recordings, etc.
            Output quality depends on source material and parameters, such as intensity settings or room size adjustments.
            Experiment with audio alternate left panning, reverse audio, or tempo beats detection to achieve desired results. For visualization, create waveform image or spectrogram image outputs.
            Note that 8D Audio relies on perceptual cues and works best with headphones, while the "Tune to 432Hz" feature alters track pitch based on alternative tuning theory.
          </p>
          <p className="mt-4">
            &copy; {new Date().getFullYear()} Audio Lab. All rights reserved.
            Further development may incorporate AI-powered enhancements like reverb presets, bass booster presets, and 8D audio effects to elevate stereo sound.
            Feedback and suggestions are crucial as we aim to expand Audio Lab’s capabilities. Always save your work by exporting processed audio files in multiple formats (MP3, WAV, FLAC).
          </p>
        </div>
      </div>
    </footer>
  );
}
