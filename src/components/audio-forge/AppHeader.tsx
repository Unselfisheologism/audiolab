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
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Audio Lab</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          {isMobile && onOpenEffectsPanel && (
            <Button variant="outline" size="icon" onClick={onOpenEffectsPanel} aria-label="Open effects panel" className="w-9 h-9">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
