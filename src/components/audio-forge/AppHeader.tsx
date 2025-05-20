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
      <div className="relative container mx-auto flex items-center justify-between">
        {/* Left Toast Card */}
        <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2">
          <div className="max-w-xs bg-white/90 shadow-lg rounded-lg p-4 border border-gray-200">
            <h2 className="font-bold text-base mb-2">Optimize Your Audio Projects</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Upload MP3, WAV, OGG, FLAC, etc.</li>
              <li>No quality loss</li>
              <li>Analysis for each edit</li>
              <li>Export as MP3, FLAC, WAV, OGG, etc.</li>
              <li>Loop the processed audio before exporting.</li>
              <li>Rhythm Detector </li>
              <li>Gain Controller & Key Transposer</li>
              <li>Bass booster & audio presets</li>
            </ul>
          </div>
        </div>

        {/* Header Main Content */}
        <div className="flex items-center gap-2 mx-auto">
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
        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2">
          <div className="max-w-xs bg-white/90 shadow-lg rounded-lg p-4 border border-gray-200">
            <h2 className="font-bold text-base mb-2">Audio Editing & Conversion Tools</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Absolutely Free </li>
              <li>Online & Web-based</li>
              <li>Play original & processed audio simultaneously</li>
              <li>Audacity & Audioalter alternative</li>
              <li>8D audio, white noise, Lo-fi, slowed and reverb tools</li>
              <li>Audio converter & audio player</li>
              <li>MP3 converter, OGG converter, FLAC converter, WAV converter</li>
              <li>MP3 to OGG, MP3 to FLAC, MP3 to WAV</li>
              <li>OGG to MP3, OGG to FLAC, OGG to WAV</li>
              <li>FLAC to MP3, FLAC to OGG, FLAC to WAV</li>
              <li>WAV to MP3, WAV to OGG, WAV to FLAC</li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
