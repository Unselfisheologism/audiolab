'use client';

import React from 'react';

const LazyFrequencyVisualizer = React.lazy(() =>
  import('./FunctionalFrequencyVisualizer').then(module => ({
    default: module.FunctionalFrequencyVisualizer
  }))
);

const LazyAmplitudePlotter = React.lazy(() =>
  import('./FunctionalAmplitudePlotter').then(module => ({
    default: module.FunctionalAmplitudePlotter
  }))
);

interface VisualizerSectionProps {
  originalAudioBuffer: AudioBuffer | null;
  processedAudioBuffer: AudioBuffer | null;
  isOriginalAudioPlaying: boolean;
  isProcessedAudioPlaying: boolean;
}

export function VisualizerSection({ 
  originalAudioBuffer, 
  processedAudioBuffer, 
  isOriginalAudioPlaying, 
  isProcessedAudioPlaying 
}: VisualizerSectionProps) {

  let bufferForFreqViz: AudioBuffer | null = null;
  let isPlayingForFreqViz = false;

  if (isProcessedAudioPlaying && processedAudioBuffer) {
    bufferForFreqViz = processedAudioBuffer;
    isPlayingForFreqViz = true;
  } else if (isOriginalAudioPlaying && originalAudioBuffer) {
    bufferForFreqViz = originalAudioBuffer;
    isPlayingForFreqViz = true;
  }

  // Amplitude plotter shows processed if available, otherwise original (static view)
  const bufferForAmplitudePlotter = processedAudioBuffer ?? originalAudioBuffer;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <React.Suspense fallback={<div>Loading Frequency Visualizer...</div>}>
        <LazyFrequencyVisualizer 
          audioBuffer={bufferForFreqViz} 
          isPlaying={isPlayingForFreqViz} 
        />
      </React.Suspense>
      <React.Suspense fallback={<div>Loading Amplitude Plotter...</div>}>
        <LazyAmplitudePlotter 
          audioBuffer={bufferForAmplitudePlotter} 
        />
      </React.Suspense>
    </div>
  );
}
