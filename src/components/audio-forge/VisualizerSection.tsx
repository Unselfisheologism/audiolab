
'use client';

import { FunctionalFrequencyVisualizer } from './FunctionalFrequencyVisualizer';
import { FunctionalAmplitudePlotter } from './FunctionalAmplitudePlotter'; // New import

interface VisualizerSectionProps {
  audioBuffer: AudioBuffer | null;
  isProcessedAudioPlaying: boolean;
}

export function VisualizerSection({ audioBuffer, isProcessedAudioPlaying }: VisualizerSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FunctionalFrequencyVisualizer 
        audioBuffer={audioBuffer} 
        isPlaying={isProcessedAudioPlaying} 
      />
      <FunctionalAmplitudePlotter 
        audioBuffer={audioBuffer} 
      />
    </div>
  );
}

