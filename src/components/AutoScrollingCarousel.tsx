"use client";
import Link from 'next/link';
import { useEffect, useRef } from "react";

export default function AutoScrollingCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    if (carousel.scrollWidth <= carousel.clientWidth) return;
    let direction = 1;
    let frame: number;

    function autoScroll() {
      if (!carousel) return;
      if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1) {
        direction = -1;
      } else if (carousel.scrollLeft <= 0) {
        direction = 1;
      }
      carousel.scrollLeft += direction * 1.1;
      frame = requestAnimationFrame(autoScroll);
    }
    frame = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section
      className="w-full overflow-x-auto no-scrollbar my-8"
      ref={carouselRef}
      aria-label="About, Philosophy, and Considerations carousel"
      tabIndex={0}
    >
      <div className="flex min-w-[950px] md:min-w-[1300px] gap-6 px-2 py-2">
        {/* LEFT TOAST CARD */}
        <article className="flex-shrink-0 bg-white/90 shadow-lg rounded-lg p-4 border border-gray-200 max-w-md min-w-[300px]">
          <h2 className="font-bold text-base mb-2 text-black">Optimize Your Audio Projects</h2>
          <ul className="list-disc list-inside text-base text-gray-700 space-y-1">
            <li>Audio files & original recordings</li>
            <li>Audio projects with minimal quality loss</li>
            <li>
              <Link href="#stereoWidener" className="text-blue-900 underline">Stereo Effects</Link>
            </li>
            <li>Key features for audio editing software</li>
            <li>Music composing software</li>
            <li>Audio analyzer & <Link href="#rhythmDetector" className="text-blue-900 underline">Rhythm Detector</Link></li>
            <li><Link href="#gainController" className="text-blue-900 underline">Audio gain controller</Link> & <Link href="#keyTransposer" className="text-blue-900 underline">Audio Key transposer</Link></li>
            <li><Link href="#bassBoosterPresets" className="text-blue-900 underline">Bass Booster</Link> & <Link href="#reverbPresets" className="text-blue-900 underline">Audio Reverb Presets</Link></li>
          </ul>
        </article>

        {/* ABOUT CARD */}
        <article className="flex-shrink-0 bg-white/90 shadow-lg rounded-lg p-6 border border-gray-200 max-w-md min-w-[300px]">
          <h2 className="text-xl font-bold mb-2 text-primary">About Audio Lab</h2>
          <p className="text-base text-gray-700">
            <strong>Empowering Creativity Through Accessible Audio Tools.</strong> At Audiolab, we provide a comprehensive collection of easy-to-use web tools to transform your audio projects.<br />
            Whether you’re tweaking vocal tracks, adding cinematic reverb effects, or crafting bass-heavy songs, our online audio toolkit delivers precision and flexibility.
          </p>
          <br />
          <span className="font-semibold text-black">Key Features:</span>
          <ul className="list-disc list-inside text-base text-gray-700 mt-2 space-y-1 pl-4">
            <li>
              <Link href="#reverbPresets" className="text-blue-900 underline">Reverb Presets</Link>: Simulate spaces from intimate bathrooms to grand concert halls.
            </li>
            <li>
              <Link href="#bassBoosterPresets" className="text-blue-900 underline">Bass Booster Presets</Link>: Enhance low frequencies with adjustable intensity.
            </li>
            <li>
              <Link href="#frequencyTuner432" className="text-blue-900 underline">Tune to 432Hz</Link>: Convert music from standard 440Hz tuning to 432Hz for a warmer, more natural sound.
            </li>
            <li>
              <Link href="#automatedSweep" className="text-blue-900 underline">Automated Sweep</Link>: Pan Audio From Left to Right Autmatically.
            </li>
            <li>
              <Link href="#audio8dConverter" className="text-blue-900 underline">8D Audio</Link>: Create immersive 3D soundscapes.
            </li>
            <li>
              <Link href="#subharmonicIntensifier" className="text-blue-900 underline">Sub-harmonic Intensifier</Link>: Boost bass & sub-bass frequencies in your audio.
            </li>
          </ul>
        </article>

        {/* PHILOSOPHY CARD */}
        <article className="flex-shrink-0 bg-white/90 shadow-lg rounded-lg p-6 border border-gray-200 max-w-md min-w-[300px]">
          <h2 className="text-xl font-bold mb-2 text-primary">Our Philosophy</h2>
          <p className="text-base text-gray-700">
            <strong>Innovation meets Accessibility.</strong><br />
            We believe audio production tools should be intuitive, powerful, and free for all creators.<br />
            Audiolab combines user-centric design with advanced algorithms for seamless processing.<br />
            <br />
            <span className="font-semibold">Why Choose Us?</span><br />
            Download in any audio file format. Edit directly in your browser. Fast processing. 
            <Link href="#bassBoosterPresets" className="text-blue-600 underline">Customizable presets for reverb, bass, and effects.</Link>
          </p>
        </article> {/* This closing tag was incorrectly placed */}

        {/* CONSIDERATIONS CARD */}
        <article className="flex-shrink-0 bg-white/90 shadow-lg rounded-lg p-6 border border-gray-200 max-w-md min-w-[300px]">
          <h2 className="text-xl font-bold mb-2 text-primary">Important Considerations</h2>
          <p className="text-base text-gray-700">
            <strong>Optimize Your Audio Workflow.</strong><br />
            For best results, keep these tips in mind:
            <br /><br />
            <b>File Format Compatibility:</b> MP3, WAV, FLAC, OGG supported.<br />
            <b>Reverb Intensity:</b> Adjust decay and EQ to avoid muddiness.<br />
            <b>Pitch Shifting:</b> Use semitone adjustments for subtle or creative effects.<br />
            <b>Noise Reduction:</b> Target specific frequencies to preserve clarity.<br />
            <b>Stereo Enhancement:</b> Use panning and auto-panner for dynamic mixes.<br />
            <b>Pro Tip:</b> Preview effects before export for a perfect result!
          </p>
        </article>

        {/* RIGHT TOAST CARD */}
        <article className="flex-shrink-0 bg-white/90 shadow-lg rounded-lg p-4 border border-gray-200 max-w-md min-w-[300px]">
          <h2 className="font-bold text-base mb-2 text-black">Audio Editing & Conversion Tools</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Free audio editor & audio editing online</li>
            <li>Audacity alternative, audioalter alternative, audiolab alternative</li>
            <li><Link href="#audio8DConverter" className="text-blue-600 underline">8D Audio</Link>, <Link href="#dreamscapeMaker" className="text-blue-600 underline">Lo-fi, Slowed and Reverb Tool</Link></li>
            <li>Audio converter & audio player</li> {/* This line had no changes */}
            <li>MP3 converter, OGG converter, FLAC converter, WAV converter</li>
            <li>MP3 to OGG, MP3 to FLAC, MP3 to WAV</li>
            <li>OGG to MP3, OGG to FLAC, OGG to WAV</li>
            <li>FLAC to MP3, FLAC to OGG, FLAC to WAV</li>
            <li>WAV to MP3, WAV to OGG, WAV to FLAC</li>
          </ul>
        </article>

      </div>
    </section>
  );
}
