
import { LegalLinks } from './LegalLinks';
import { Separator } from '@/components/ui/separator';
import { FaYoutube, FaXTwitter, FaLinkedin, FaMedium, FaDiscord } from "react-icons/fa6"; // <-- Add this line

export function AppFooter() {
  return (
    <footer className="bg-muted text-muted-foreground p-6 md:p-8 mt-auto w-full border-t">
      <div className="container mx-auto text-center">
        {/* About and Philosophy Sections - keeping these as they were */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h5 className="font-semibold text-foreground mb-2">About Audio Lab</h5>
            <p className="text-sm">
              Empowering Creativity Through Accessible Audio Tools
              At Audiolab, we provide a comprehensive collection of easy-to-use web tools to transform your audio projects.
              Whether you’re tweaking vocal tracks, adding cinematic reverb effects (hall, church, cathedral, or small room presets),
              or crafting bass-heavy songs, our online audio toolkit delivers precision and flexibility.

              Key Features:

              Reverb Presets : Simulate spaces from intimate bathrooms to grand concert halls.
              Bass Booster Presets : Enhance low frequencies with adjustable intensity (moderate, heavy, extreme).
              Pitch & Tempo : Shift pitch by semitones or adjust beats per minute without quality loss.
              Vocal Removal : Isolate or remove vocals from songs for instrumental mixes.
              8D Audio & Stereo Enhancement : Create immersive 3D soundscapes or deepen stereo width.
              Noise Reduction : Clean background noise from recordings with adjustable frequency filters.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-2">Our Philosophy</h5>
            <p className="text-sm">
              Innovation meets Accessibility
              We believe audio production tools should be intuitive, powerful, and free for all creators. 
              Audiolab combines user-centric design with advanced algorithms to deliver seamless processing for MP3, WAV, FLAC, and OGG files. 
              Whether you’re a pro engineer or a hobbyist, our web-based tools empower you to:
              Replicate live concert ambiance with room-size reverb presets.
              Tune vocals for clarity or apply extreme intensity effects for experimental sounds.
              Visualize audio with spectrogram and waveform images for precise editing.
              Why Choose Us?
              Download in any audio file format.
              Edit directly in your browser. 
              Fast processing : Convert, boost, or reverse audio files instantly. 
              Customizable presets : Save and reuse your favorite settings for reverb, bass, or light intensity effects.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-foreground mb-2">Important Considerations</h5>
            <p className="text-sm">
              Optimize Your Audio Workflow
              To ensure high-quality results, keep these tips in mind:

              File Format Compatibility : Support for MP3, WAV, FLAC, and OGG ensures flexibility .
              Reverb Intensity : Adjust decay time and EQ filters to avoid muddiness in bass-heavy tracks .
              Pitch Shifting : Use semitone adjustments for subtle tuning or extreme effects without distortion .
              Noise Reduction : Target specific frequencies (e.g., 60Hz hum) to preserve vocal clarity .
              Stereo Enhancement : Balance left/right panning or apply auto-panner effects for dynamic mixes .
              Pro Tip : Preview effects like slowed reverb , 8D audio , or bass booster presets before exporting to perfect your sound.
            </p>
          </div>
        </div>

        {/* === SOCIAL ICONS START === */}
        <div className="flex justify-center gap-4 mb-6">
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
        {/* === SOCIAL ICONS END === */}

        {/* Legal Links Section */}
        <LegalLinks />

        <Separator className="my-6 bg-border/50" />

        {/* Copyright and Disclaimers */}
        <div className="text-xs">
          <p>
            Audio Lab leverages open-source libraries and technologies like the Web Audio API to deliver an online audio toolkit with easy-to-use web tools.
            All processing occurs locally in your browser, ensuring your audio files remain private—no uploads to servers for reverb preset adjustments, bass booster preset enhancements, or 8D audio effects. 
            This application serves demonstration and educational purposes, emphasizing responsible use of tools like pitch-shifted tracks, semitones-rounded tuning, and vocal tracks editing.
            Always back up original audio files before applying effects such as reverb effect simulations (e.g., cathedral, church hall, or small room presets), noise reduction for background recordings, or stereo sound adding.
            Output quality depends on source material and parameters, such as intensity settings (moderate, heavy, extreme) or room size adjustments.
            Experiment with audio alternate left panning, reverse audio, or tempo beats detection to achieve desired results. For visualization, create waveform image or spectrogram image outputs.
            Note that 8D Audio relies on perceptual cues like moving circles head positioning and works best with headphones, while the "Tune to 432Hz" feature alters track pitch based on alternative pitch theories, with perceived clearer benefits debated among users.
          </p>
          <p className="mt-4">
            &copy; {new Date().getFullYear()} Audio Lab. All rights reserved.
            Further development may incorporate AI-powered enhancements like reverb presets,
            bass booster presets, and 8D audio effects to elevate stereo sound.
            Collaborative tools could enable preset sharing, track pitch adjustments,
            or room-size reverb simulations (e.g., cathedral, church hall, or small room settings).
            Feedback and suggestions are crucial as we aim to expand Audio Lab’s capabilities—whether
            refining pitch-shifted tracks , optimizing noise reduction for background recordings,
            or enhancing vocal tracks with extreme intensity presets. Always save your work by exporting
            processed audio files in multiple formats (MP3, WAV, FLAC) , ensuring seamless
            integration into live concert mixes  or personal projects.
          </p>
        </div>
      </div>
    </footer>
  );
}
