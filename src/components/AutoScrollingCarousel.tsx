// src/components/AutoScrollingCarousel.tsx
"use client";
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
        <article className="flex-shrink-0 bg-white/90 shadow-lg rounded-lg p-6 border border-gray-200 max-w-md min-w-[300px]">
          <h2 className="text-xl font-bold mb-2 text-primary">About Audio Lab</h2>
          <p className="text-sm text-gray-700">
            <strong>Empowering Creativity Through Accessible Audio Tools.</strong> At Audiolab, we provide a comprehensive collection of easy-to-use web tools to transform your audio projects.<br />
            Whether you’re tweaking vocal tracks, adding cinematic reverb effects, or crafting bass-heavy songs, our online audio toolkit delivers precision and flexibility.
            <br /><br />
            <span className="font-semibold">Key Features:</span><br />
            Reverb Presets, Bass Booster Presets, Pitch &amp; Tempo, Vocal Removal, 8D Audio &amp; Stereo Enhancement, Noise Reduction, and more.
          </p>
        </article>
        <article className="flex-shrink-0 bg-white/90 shadow-lg rounded-lg p-6 border border-gray-200 max-w-md min-w-[300px]">
          <h2 className="text-xl font-bold mb-2 text-primary">Our Philosophy</h2>
          <p className="text-sm text-gray-700">
            <strong>Innovation meets Accessibility.</strong><br />
            We believe audio production tools should be intuitive, powerful, and free for all creators.<br />
            Audiolab combines user-centric design with advanced algorithms for seamless processing.<br />
            <br />
            <span className="font-semibold">Why Choose Us?</span><br />
            Download in any audio file format. Edit directly in your browser. Fast processing. Customizable presets for reverb, bass, and effects.
          </p>
        </article>
        <article className="flex-shrink-0 bg-white/90 shadow-lg rounded-lg p-6 border border-gray-200 max-w-md min-w-[300px]">
          <h2 className="text-xl font-bold mb-2 text-primary">Important Considerations</h2>
          <p className="text-sm text-gray-700">
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
      </div>
    </section>
  );
}
