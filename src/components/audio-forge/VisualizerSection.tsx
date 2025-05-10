
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart as RechartsLineChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import { FunctionalFrequencyVisualizer } from './FunctionalFrequencyVisualizer';

// Static amplitude data, can be made dynamic later
const amplitudeChartData = Array.from({ length: 100 }, (_, i) => ({
  time: i,
  amplitude: Math.sin(i * 0.2) * 50 + Math.random() * 10 - 5,
}));

const amplitudeChartConfig = {
  amplitude: { label: "Amplitude", color: "hsl(var(--accent))" },
} satisfies ChartConfig;

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

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="text-primary" />
            Amplitude Plotter (Static)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px]">
           <ChartContainer config={amplitudeChartConfig} className="w-full h-full">
            <RechartsLineChart accessibilityLayer data={amplitudeChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(value) => `${value}ms`} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={30} fontSize={12} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Line dataKey="amplitude" type="monotone" stroke="var(--color-amplitude)" strokeWidth={2} dot={false} />
            </RechartsLineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
