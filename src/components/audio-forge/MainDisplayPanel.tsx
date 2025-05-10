
'use client';
import React, { useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { VisualizerSection } from './VisualizerSection';
import { ExportPanel } from './ExportPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BotMessageSquare } from 'lucide-react';


interface MainDisplayPanelProps {
  originalAudioDataUrl: string | null;
  processedAudioDataUrl: string | null;
  audioBuffer: AudioBuffer | null; // For visualizer
  onExport: (format: string, quality: string) => void;
  isLoading: boolean;
  analysisResult: string | null;
  originalFileName?: string;
}

export function MainDisplayPanel({
  originalAudioDataUrl,
  processedAudioDataUrl,
  audioBuffer,
  onExport,
  isLoading,
  analysisResult,
  originalFileName
}: MainDisplayPanelProps) {
  const [isProcessedAudioPlaying, setIsProcessedAudioPlaying] = useState(false);

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AudioPlayer title="Original Audio" audioSrc={originalAudioDataUrl} fileName={originalFileName ? `original_${originalFileName}` : "original_audio.wav"} />
          <AudioPlayer 
            title="Processed Audio" 
            audioSrc={processedAudioDataUrl} 
            fileName={originalFileName ? `processed_${originalFileName}` : "processed_audio.wav"}
            onPlayStateChange={setIsProcessedAudioPlaying}
          />
        </div>
        
        <VisualizerSection 
          audioBuffer={audioBuffer} 
          isProcessedAudioPlaying={isProcessedAudioPlaying} 
        />

        {analysisResult && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BotMessageSquare className="text-primary" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly
                value={analysisResult}
                className="min-h-[100px] bg-muted/50"
                aria-label="AI Analysis Result"
              />
            </CardContent>
          </Card>
        )}

        <ExportPanel 
          processedAudioDataUrl={processedAudioDataUrl} 
          onExport={onExport}
          isLoading={isLoading}
          originalFileName={originalFileName}
        />
      </div>
    </ScrollArea>
  );
}
