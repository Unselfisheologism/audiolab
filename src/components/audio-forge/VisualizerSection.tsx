import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartBig, LineChart } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart as RechartsLineChart, ResponsiveContainer } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"

const frequencyChartData = [
  { band: "20Hz", level: 30 }, { band: "60Hz", level: 50 },
  { band: "250Hz", level: 70 }, { band: "1kHz", level: 60 },
  { band: "4kHz", level: 40 }, { band: "16kHz", level: 20 },
];

const amplitudeChartData = Array.from({ length: 100 }, (_, i) => ({
  time: i,
  amplitude: Math.sin(i * 0.2) * 50 + Math.random() * 10 - 5,
}));


const frequencyChartConfig = {
  level: { label: "Level (dB)", color: "hsl(var(--primary))" },
} satisfies ChartConfig

const amplitudeChartConfig = {
  amplitude: { label: "Amplitude", color: "hsl(var(--accent))" },
} satisfies ChartConfig


export function VisualizerSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartBig className="text-primary" />
            Frequency Visualizer
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px]">
          <ChartContainer config={frequencyChartConfig} className="w-full h-full">
            <BarChart accessibilityLayer data={frequencyChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="band" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={30} fontSize={12}/>
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="level" fill="var(--color-level)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="text-primary" />
            Amplitude Plotter
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px]">
           <ChartContainer config={amplitudeChartConfig} className="w-full h-full">
            <RechartsLineChart accessibilityLayer data={amplitudeChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} type="number" domain={['dataMin', 'dataMax']} tickFormatter={(value) => `${value}ms`} />
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