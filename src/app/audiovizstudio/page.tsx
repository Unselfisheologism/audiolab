
"use client";

import type { Metadata } from 'next'; // Keep for potential page-specific metadata
import { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/audioviz/app-header';
import AppFooter from '@/components/audioviz/app-footer';
import FileUploadSection from '@/components/audioviz/file-upload-section';
import AudioTranscriptSection from '@/components/audioviz/audio-transcript-section';
import TemplateCustomizationSection from '@/components/audioviz/template-customization-section';
import ExportSection from '@/components/audioviz/export-section';
import type { TranscriptLine, VideoTemplateValue, VideoResolution, VideoAspectRatio, VideoOutputFormat, BackgroundConfig, IconPosition, TranscriptStyleConfig } from '@/types/audiovizTypes';
import { videoTemplates, defaultTranscriptStyleConfig } from '@/types/audiovizTypes';
import { useToast } from '@/hooks/use-toast'; // Assuming audiolab has this

// Page-specific metadata (optional, can be defined in layout if preferred)
// export const metadata: Metadata = {
//   title: 'AudioViz Studio - AudioLab',
//   description: 'Create stunning audio visualizations within AudioLab.',
// };

export default function AudioVizStudioPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);

  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplateValue>('song');

  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig | null>(() => {
    const initialTemplate = videoTemplates.find(t => t.value === 'song');
    return initialTemplate ? { type: 'url', value: initialTemplate.defaultBackgroundUrl } : null;
  });

  const [resolution, setResolution] = useState<VideoResolution>('1080p');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [outputFormat, setOutputFormat] = useState<VideoOutputFormat>('webm');

  const [customIconFile, setCustomIconFile] = useState<File | null>(null);
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [useDefaultIcon, setUseDefaultIcon] = useState<boolean>(true);
  const [iconPosition, setIconPosition] = useState<IconPosition>('top-left');

  const [transcriptPosition, setTranscriptPosition] = useState<IconPosition>('bottom-center');
  const [transcriptStyleConfig, setTranscriptStyleConfig] = useState<TranscriptStyleConfig>(defaultTranscriptStyleConfig);

  const { toast } = useToast();

  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setAudioFileUrl(null);
  }, [audioFile]);

  useEffect(() => {
    if (customIconFile) {
      const url = URL.createObjectURL(customIconFile);
      setCustomIconUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setCustomIconUrl(null);
  }, [customIconFile]);

  useEffect(() => {
    const currentTemplateData = videoTemplates.find(t => t.value === selectedTemplate);
    if (currentTemplateData) {
      if (backgroundConfig === null || backgroundConfig.type === 'url') {
         if (backgroundConfig === null || backgroundConfig.value !== currentTemplateData.defaultBackgroundUrl) {
            setBackgroundConfig({ type: 'url', value: currentTemplateData.defaultBackgroundUrl });
        }
      }
    }
  }, [selectedTemplate, backgroundConfig]);

  const handleAudioUpload = useCallback((file: File) => {
    setAudioFile(file);
  }, []);

  const handleTranscriptUpload = useCallback((file: File) => {
    setTranscriptFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text.split(/\r?\n/).map((line, index) => ({
          id: `line-${index}-${Date.now()}`,
          text: line.trim(),
        })).filter(line => line.text);
        setTranscriptLines(lines);
        toast({ title: "Transcript loaded", description: `${lines.length} lines processed.` });
      }
    };
    reader.onerror = () => {
      toast({ variant: "destructive", title: "Error reading transcript", description: "Could not read the transcript file."});
    };
    reader.readAsText(file);
  }, [toast]);

  const handleTranscriptChange = useCallback((index: number, newText: string) => {
    setTranscriptLines(prevLines =>
      prevLines.map((line, i) => (i === index ? { ...line, text: newText } : line))
    );
  }, []);

  const handleTemplateChange = useCallback((templateValue: VideoTemplateValue) => {
    setSelectedTemplate(templateValue);
  }, []);


  return (
    // Removed the overall flex flex-col min-h-screen, as this will be part of audiolab's layout
    // AppHeader and AppFooter are now specific to this page's content area if needed,
    // or you might remove them if audiolab provides global ones.
    // For now, keeping them to replicate the original structure within this page.
    <div className="flex flex-col w-full">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FileUploadSection
            onAudioUpload={handleAudioUpload}
            onTranscriptUpload={handleTranscriptUpload}
          />
          <TemplateCustomizationSection
            selectedTemplate={selectedTemplate}
            onTemplateChange={handleTemplateChange}
            backgroundConfig={backgroundConfig}
            onBackgroundConfigChange={setBackgroundConfig}
            resolution={resolution}
            onResolutionChange={setResolution}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            outputFormat={outputFormat}
            onOutputFormatChange={setOutputFormat}
            customIconFile={customIconFile}
            onCustomIconFileChange={setCustomIconFile}
            useDefaultIcon={useDefaultIcon}
            onUseDefaultIconChange={setUseDefaultIcon}
            iconPosition={iconPosition}
            onIconPositionChange={setIconPosition}
            transcriptPosition={transcriptPosition}
            onTranscriptPositionChange={setTranscriptPosition}
            transcriptStyleConfig={transcriptStyleConfig}
            onTranscriptStyleConfigChange={setTranscriptStyleConfig}
          />
        </div>
        <AudioTranscriptSection
          transcriptLines={transcriptLines}
          onTranscriptChange={handleTranscriptChange}
          audioFileUrl={audioFileUrl}
          backgroundConfig={backgroundConfig}
          selectedTemplate={selectedTemplate}
          aspectRatio={aspectRatio}
          customIconUrl={customIconUrl}
          useDefaultIcon={useDefaultIcon}
          iconPosition={iconPosition}
          transcriptPosition={transcriptPosition}
          transcriptStyleConfig={transcriptStyleConfig}
        />
        {audioFile && (
          <ExportSection
            audioFile={audioFile}
            backgroundConfig={backgroundConfig}
            transcriptLines={transcriptLines}
            selectedTemplate={selectedTemplate}
            resolution={resolution}
            aspectRatio={aspectRatio}
            customIconFile={customIconFile}
            useDefaultIcon={useDefaultIcon}
            iconPosition={iconPosition}
          />
        )}
      </main>
      <AppFooter />
    </div>
  );
}
