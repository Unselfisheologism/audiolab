import { Music, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggleButton from '@/components/ThemeToggleButton';

interface AppHeaderProps {
  isMobile?: boolean;
  onOpenEffectsPanel?: () => void;
}

export function AppHeader({ isMobile, onOpenEffectsPanel }: AppHeaderProps) {
  return (
    <header className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur z-50">
      <div className="container mx-auto flex items-center justify-between gap-4">
        {/* Left Toast Card */}
        <div className="hidden lg:flex flex-col justify-center max-w-xs bg-white/90 shadow-lg rounded-lg p-4 border border-gray-200 min-w-[220px]">
          <h2 className="font-bold text-base mb-2 text-black">Optimize Your Audio Projects</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Audio files & original recordings</li>
            <li>Audio projects with minimal quality loss</li>
            <li>Noise reduction</li>
            <li>Key features for audio editing software</li>
            <li>Music composing software</li>
            <li>Audio analyzer & rhythm detector</li>
            <li>Audio gain controller & audio key transposer</li>
            <li>Bass booster & audio presets</li>
          </ul>
        </div>

        {/* Header Main Content */}
        <div className="flex flex-1 items-center justify-center gap-2">
          <Music className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Audio Lab</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          {isMobile && onOpenEffectsPanel && (
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenEffectsPanel}
              aria-label="Open effects panel"
              className="w-9 h-9"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Right Toast Card */}
        <div className="hidden lg:flex flex-col justify-center max-w-xs bg-white/90 shadow-lg rounded-lg p-4 border border-gray-200 min-w-[220px]">
          <h2 className="font-bold text-base mb-2 text-black">Audio Editing & Conversion Tools</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Free audio editor & audio editing online</li>
            <li>Audacity alternative, audioalter alternative, audiolab alternative</li>
            <li>8D audio, white noise, Lo-fi, slowed and reverb tool</li>
            <li>Audio converter & audio player</li>
            <li>MP3 converter, OGG converter, FLAC converter, WAV converter</li>
            <li>MP3 to OGG, MP3 to FLAC, MP3 to WAV</li>
            <li>OGG to MP3, OGG to FLAC, OGG to WAV</li>
            <li>FLAC to MP3, FLAC to OGG, FLAC to WAV</li>
            <li>WAV to MP3, WAV to OGG, WAV to FLAC</li>
          </ul>
        </div>
      </div>
    </header>
  );
}
