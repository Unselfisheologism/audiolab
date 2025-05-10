
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartBig } from 'lucide-react';

interface FunctionalFrequencyVisualizerProps {
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
}

const chartConfig = {
  level: { label: "Level (dB)", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const NUM_BARS = 32; // Number of bars to display
const FFT_SIZE = 256; // Must be a power of 2. frequencyBinCount = FFT_SIZE / 2;

export function FunctionalFrequencyVisualizer({ audioBuffer, isPlaying }: FunctionalFrequencyVisualizerProps) {
  const [frequencyData, setFrequencyData] = useState<{ band: string; level: number }[]>(
    Array(NUM_BARS).fill(null).map((_, i) => ({ band: `${i + 1}`, level: 0 }))
  );

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    // Initialize AudioContext locally for this component
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const localAudioContext = audioContextRef.current;

    // Cleanup function for the effect
    const cleanup = () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (sourceNodeRef.current) {
        try {
            sourceNodeRef.current.stop();
        } catch(e) { /* ignore if already stopped */ }
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      analyserNodeRef.current?.disconnect();
      // Don't null out analyserNodeRef here, it might be reused if context persists
      // Reset frequency data when audioBuffer is null or playback stops or on unmount
      setFrequencyData(Array(NUM_BARS).fill(null).map((_, i) => ({ band: `${i + 1}`, level: 0 })));
    };
    
    if (!audioBuffer || !isPlaying || !localAudioContext || localAudioContext.state === 'closed') {
      cleanup();
      if (localAudioContext && localAudioContext.state === 'closed' && audioBuffer && isPlaying) {
        // Re-initialize if context was closed (e.g. by browser)
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      return;
    }
    
    // Setup AnalyserNode
    if (!analyserNodeRef.current || analyserNodeRef.current.context.state === 'closed') {
        analyserNodeRef.current = localAudioContext.createAnalyser();
        analyserNodeRef.current.fftSize = FFT_SIZE;
    }
    const analyser = analyserNodeRef.current;
    
    // Setup Data Array
    if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.frequencyBinCount) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    const dataArray = dataArrayRef.current;

    // Create and connect AudioBufferSourceNode
    sourceNodeRef.current = localAudioContext.createBufferSource();
    sourceNodeRef.current.buffer = audioBuffer;
    sourceNodeRef.current.connect(analyser);
    // Not connecting analyser to destination to avoid re-playing audio here. AudioPlayer handles playback.
    
    try {
      sourceNodeRef.current.start(0);
    } catch(e) {
      console.warn("Could not start audio source for visualizer:", e);
      cleanup(); // Clean up if start fails
      return;
    }

    const draw = () => {
      if (analyser && dataArray && sourceNodeRef.current) { // Check sourceNodeRef.current to ensure it's active
        analyser.getByteFrequencyData(dataArray); 

        const newFrequencyLevels = [];
        const binCount = analyser.frequencyBinCount;
        const step = Math.max(1, Math.floor(binCount / NUM_BARS)); // Ensure step is at least 1

        for (let i = 0; i < NUM_BARS; i++) {
          let sum = 0;
          const startBin = i * step;
          const endBin = Math.min(startBin + step, binCount); // Ensure we don't go out of bounds
          
          if (startBin >= binCount) break; // Stop if we've processed all available bins

          for (let j = startBin; j < endBin; j++) {
            sum += dataArray[j];
          }
          const countInStep = endBin - startBin;
          const average = countInStep > 0 ? sum / countInStep : 0;
          newFrequencyLevels.push({ band: `${i + 1}`, level: average });
        }
        setFrequencyData(newFrequencyLevels);
      }
      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    draw();

    // This return is the cleanup for this specific effect invocation
    return cleanup;

  }, [audioBuffer, isPlaying]); // Rerun effect if audioBuffer or isPlaying changes

  // Effect for cleaning up the AudioContext when the component unmounts
  useEffect(() => {
    const contextToClose = audioContextRef.current;
    return () => {
      contextToClose?.close().catch(e => console.error("Error closing visualizer audio context on unmount", e));
      audioContextRef.current = null; // Ensure it's nulled for next mount if any
    };
  }, []);


  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChartBig className="text-primary" />
          Frequency Visualizer
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart accessibilityLayer data={frequencyData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }} barGap={2}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis 
                dataKey="band" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                fontSize={10} 
                interval="preserveStartEnd" 
            />
            <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                width={30} 
                fontSize={10} 
                domain={[0, 255]} 
            />
            <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent indicator="dot" hideLabel />} 
            />
            <Bar dataKey="level" fill="var(--color-level)" radius={1} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
