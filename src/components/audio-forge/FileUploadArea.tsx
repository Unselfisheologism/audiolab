import type React from 'react';
import { UploadCloud } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface FileUploadAreaProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  isLoading: boolean;
}

export function FileUploadArea({ onFileSelect, selectedFile, isLoading }: FileUploadAreaProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="text-primary" />
          Upload Audio
        </CardTitle>
        <CardDescription>
          Select an audio file (e.g., MP3, WAV, WebM, OGG, FLAC, AAC, M4A) to start forging. 
          Accepts most common audio formats. While files of any size can be selected, 
          processing very large files may be slow or unstable due to client-side limitations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="audio-file" className="sr-only">Audio File</Label>
          <Input
            id="audio-file"
            type="file"
            accept="audio/*,.mp3,.wav,.webm,.weba,.ogg,.flac,.aac,.m4a"
            onChange={handleFileChange}
            disabled={isLoading}
            className="cursor-pointer file:text-primary file:font-semibold hover:file:bg-primary/10"
          />
        </div>
        {selectedFile && (
          <p className="text-sm text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{selectedFile.name}</span>
          </p>
        )}
        {selectedFile && (
           <Button onClick={() => onFileSelect(null)} variant="outline" size="sm" disabled={isLoading}>
            Clear Selection
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
