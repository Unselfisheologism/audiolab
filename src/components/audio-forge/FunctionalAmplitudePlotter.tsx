
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Line, LineChart as RechartsLineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart as LineChartIcon } from 'lucide-react';

interface FunctionalAmplitudePlotterProps {
  audioBuffer: AudioBuffer | null;
}

const chartConfig = {
  amplitude: { label: "Amplitude", color: "hsl(var(--accent))" },
} satisfies ChartConfig;

const NUM_PLOT_POINTS = 200; // Number of points to plot for the waveform

export function FunctionalAmplitudePlotter({ audioBuffer }: FunctionalAmplitudePlotterProps) {
  const [amplitudeData, setAmplitudeData] = useState<{ time: number; amplitude: number }[]>([]);

  useEffect(() => {
    if (audioBuffer) {
      const channelData = audioBuffer.getChannelData(0); // Use the first channel
      const totalSamples = channelData.length;

      if (totalSamples === 0) {
        setAmplitudeData([]);
        return;
      }

      const dataPoints = [];
      // Determine how many points to actually render based on NUM_PLOT_POINTS and totalSamples
      const pointsToRender = Math.min(NUM_PLOT_POINTS, totalSamples);
      // Calculate step: if totalSamples < pointsToRender, step will be < 1, meaning we might pick same sample.
      // Correct step should ensure we span totalSamples with pointsToRender.
      const step = totalSamples / pointsToRender;


      for (let i = 0; i < pointsToRender; i++) {
        const sampleIndex = Math.floor(i * step);
        // Ensure sampleIndex is within bounds
        const boundedSampleIndex = Math.min(sampleIndex, totalSamples - 1); 
        
        const amplitudeValue = channelData[boundedSampleIndex];
        const timeMs = (boundedSampleIndex / audioBuffer.sampleRate) * 1000;
        dataPoints.push({ time: timeMs, amplitude: amplitudeValue });
      }
      
      // Ensure the very last sample is included if it wasn't captured by the loop
      // This happens if (pointsToRender - 1) * step doesn't exactly land on totalSamples - 1
      if (pointsToRender > 0 && dataPoints.length > 0) {
          const lastSampledIndexInLoop = Math.min(Math.floor((pointsToRender - 1) * step), totalSamples - 1);
          if (lastSampledIndexInLoop < totalSamples - 1) {
              const finalSampleIndex = totalSamples - 1;
              const amplitudeValue = channelData[finalSampleIndex];
              const timeMs = (finalSampleIndex / audioBuffer.sampleRate) * 1000;
              // Add if it's a distinct time point from the last one added
              if (dataPoints[dataPoints.length - 1].time < timeMs) {
                  dataPoints.push({ time: timeMs, amplitude: amplitudeValue });
              }
          }
      }
      setAmplitudeData(dataPoints);
    } else {
      setAmplitudeData([]); // Clear data if no buffer
    }
  }, [audioBuffer]);

  const yAxisDomain = useMemo(() => {
    if (!amplitudeData || amplitudeData.length === 0) return [-1, 1];
    let min = 0;
    let max = 0;
    amplitudeData.forEach(point => {
        if (point.amplitude < min) min = point.amplitude;
        if (point.amplitude > max) max = point.amplitude;
    });
    // Ensure domain is at least -1 to 1 if data is flat or very small range
    min = Math.min(min, -0.1); 
    max = Math.max(max, 0.1);

    const padding = Math.max(0.1, (max - min) * 0.1); // Add some padding
    
    return [Math.max(-1, Math.floor((min - padding) * 10) / 10), Math.min(1, Math.ceil((max + padding) * 10) / 10)];
  }, [amplitudeData]);


  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-baseline gap-2">
          <LineChartIcon className="text-primary h-5 w-5" />
          <span className="text-xl">Amplitude Plotter</span>
          <span className="text-sm text-muted-foreground ml-1">(Static)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        {audioBuffer && audioBuffer.length > 0 && amplitudeData.length > 0 ? (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <RechartsLineChart data={amplitudeData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                type="number" 
                domain={['dataMin', 'dataMax']} 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                fontSize={10} 
                tickFormatter={(value) => `${(value / 1000).toFixed(1)}s`} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                width={30} 
                fontSize={10}
                domain={yAxisDomain}
                allowDataOverflow={false} // Clip data outside domain
              />
              <ChartTooltip 
                cursor={false} 
                content={<ChartTooltipContent 
                            formatter={(value, name, props) => [`${(value as number).toFixed(3)}`, name]} 
                            labelFormatter={(label) => `Time: ${(Number(label) / 1000).toFixed(2)}s`}
                         />} 
              />
              <Line dataKey="amplitude" type="monotone" stroke="var(--color-amplitude)" strokeWidth={1.5} dot={false} />
            </RechartsLineChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {!audioBuffer ? "Load audio to see amplitude." : 
             (audioBuffer.length === 0 ? "Audio buffer is empty." : "Processing amplitude...")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

