"use client";

import type React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileAudio, FileText } from "lucide-react";
import { useToast } from '@/hooks/use-toast'; // Assuming audiolab has this

interface FileUploadSectionProps {
  onAudioUpload: (file: File) => void;
  onTranscriptUpload: (file: File) => void;
}

export default function FileUploadSection({ onAudioUpload, onTranscriptUpload }: FileUploadSectionProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      onAudioUpload(file);
      toast({ title: "Audio file selected", description: file.name });
    }
  };

  const handleTranscriptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTranscriptFile(file);
      onTranscriptUpload(file);
      toast({ title: "Transcript file selected", description: file.name });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <UploadCloud className="mr-2 h-6 w-6 text-primary" />
          Upload Files
        </CardTitle>
        <CardDescription>Select your audio and transcript files to get started.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="audio-upload" className="text-base font-medium flex items-center">
            <FileAudio className="mr-2 h-5 w-5 text-primary" /> Audio File (.mp3, .wav)
          </Label>
          <Input
            id="audio-upload"
            type="file"
            accept=".mp3,.wav"
            onChange={handleAudioFileChange}
            className="file:text-primary file:font-semibold"
          />
          {audioFile && <p className="text-sm text-muted-foreground mt-1">Selected: {audioFile.name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="transcript-upload" className="text-base font-medium flex items-center">
            <FileText className="mr-2 h-5 w-5 text-primary" /> Transcript File (.txt, .srt)
          </Label>
          <Input
            id="transcript-upload"
            type="file"
            accept=".txt,.srt"
            onChange={handleTranscriptFileChange}
            className="file:text-primary file:font-semibold"
          />
          {transcriptFile && <p className="text-sm text-muted-foreground mt-1">Selected: {transcriptFile.name}</p>}
        </div>
        <Button variant="outline" className="w-full" disabled={!audioFile || !transcriptFile}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Files Ready
        </Button>
      </CardContent>
    </Card>
  );
}
