
"use client";

import { Music2 } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
       {/* This header is now part of the AudioVizStudioPage content.
           audiolab might have its own global header. */}
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center">
        <Music2 size={32} className="mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold">Audio to Video Converter</h1>
      </div>
    </header>
  );
}
