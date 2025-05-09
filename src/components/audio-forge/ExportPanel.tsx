import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Settings2 } from 'lucide-react';

interface ExportPanelProps {
  processedAudioDataUrl: string | null;
  onExport: (format: string, quality: string) => void;
  isLoading: boolean;
  originalFileName?: string;
}

export function ExportPanel({ processedAudioDataUrl, onExport, isLoading, originalFileName }: ExportPanelProps) {
  const [format, setFormat] = useState('wav');
  const [quality, setQuality] = useState('high');

  const handleExport = () => {
    if (processedAudioDataUrl) {
      onExport(format, quality);
      // Actual download link will be part of the AudioPlayer, 
      // this button just triggers the conceptual export logic.
      // For a real app, this might involve backend processing or client-side library.
      const link = document.createElement('a');
      link.href = processedAudioDataUrl;
      const name = originalFileName ? originalFileName.substring(0, originalFileName.lastIndexOf('.')) : 'audio';
      link.download = `${name}_forged.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="text-primary" />
          Export Configuration
        </CardTitle>
        <CardDescription>Choose your preferred output settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={setFormat} disabled={isLoading || !processedAudioDataUrl}>
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wav">WAV</SelectItem>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="flac">FLAC</SelectItem>
                <SelectItem value="ogg">OGG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="quality">Quality</Label>
            <Select value={quality} onValueChange={setQuality} disabled={isLoading || !processedAudioDataUrl || format !== 'mp3'}> {/* Quality typically for lossy like MP3 */}
              <SelectTrigger id="quality">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High (320kbps)</SelectItem>
                <SelectItem value="medium">Medium (192kbps)</SelectItem>
                <SelectItem value="low">Low (128kbps)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleExport}
          disabled={!processedAudioDataUrl || isLoading}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Audio
        </Button>
      </CardFooter>
    </Card>
  );
}