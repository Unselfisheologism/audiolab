import { Music } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur z-50">
      <div className="container mx-auto flex items-center gap-2">
        <Music className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-primary">Audio Forge</h1>
      </div>
    </header>
  );
}