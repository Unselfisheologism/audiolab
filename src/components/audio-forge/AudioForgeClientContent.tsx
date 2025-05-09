'use client';

import React, { useState, useCallback } from 'react';
import { AppHeader } from './AppHeader';
import { AudioControlsPanel } from './AudioControlsPanel';
import { MainDisplayPanel } from './MainDisplayPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { EffectSettings } from '@/types/audio-forge';
import { useToast } from '@/hooks/use-toast';
import { audioUtils, fileToDataUrl } from '@/lib/audio-utils';
import { effectsList } from '@/app/audio-forge/effects';

export default function AudioForgeClientContent() {
  const [originalAudioFile, setOriginalAudioFile] = useState<File | null>(null);
  const [originalAudioDataUrl, setOriginalAudioDataUrl] = useState<string | null>(null);
  const [processedAudioDataUrl, setProcessedAudioDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [effectSettings, setEffectSettings] = useState<Record<string, EffectSettings>>(() => {
    // Initialize default settings for all effects
    const initialSettings: Record<string, EffectSettings> = {};
    effectsList.forEach(effect => {
      initialSettings[effect.id] = {};
      effect.parameters?.forEach(param => {
        initialSettings[effect.id][param.name] = param.defaultValue;
      });
    });
    return initialSettings;
  });

  const { toast } = useToast();

  const handleFileSelect = useCallback(async (file: File | null) => {
    setOriginalAudioFile(file);
    if (file) {
      setIsLoading(true);
      try {
        const dataUrl = await fileToDataUrl(file);
        setOriginalAudioDataUrl(dataUrl);
        setProcessedAudioDataUrl(dataUrl); // Initially, processed is same as original
        setAnalysisResult(null); // Clear previous analysis
        toast({ title: "Audio Loaded", description: `${file.name} is ready for forging.` });
      } catch (error) {
        console.error("Error loading file:", error);
        toast({ title: "Error", description: "Could not load audio file.", variant: "destructive" });
        setOriginalAudioDataUrl(null);
        setProcessedAudioDataUrl(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setOriginalAudioDataUrl(null);
      setProcessedAudioDataUrl(null);
      setAnalysisResult(null);
    }
  }, [toast]);

  const handleParameterChange = useCallback((effectId: string, paramName: string, value: any) => {
    setEffectSettings(prev => ({
      ...prev,
      [effectId]: {
        ...prev[effectId],
        [paramName]: value,
      },
    }));
  }, []);

  const handleApplyEffect = useCallback(async (effectId: string, params: EffectSettings) => {
    if (!originalAudioDataUrl) {
      toast({ title: "No Audio", description: "Please upload an audio file first.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null); // Clear previous analysis for new effect application
    const currentAudio = processedAudioDataUrl || originalAudioDataUrl; // Apply effect to currently processed audio or original

    try {
      let result: { processedAudioDataUrl: string; analysis?: string } = { processedAudioDataUrl: currentAudio };
      const effect = effectsList.find(e => e.id === effectId || e.parameters?.find(p => p.handlerKey === effectId));
      const actualHandlerKey = effect?.parameters?.find(p => p.handlerKey === effectId)?.handlerKey || effect?.handlerKey || effectId;
      
      const combinedParams = { ...effectSettings[effectId], ...params };

      if (audioUtils[actualHandlerKey]) {
        result = await audioUtils[actualHandlerKey](currentAudio, combinedParams);
      } else {
        throw new Error(`Handler for ${actualHandlerKey} not found.`);
      }
      
      setProcessedAudioDataUrl(result.processedAudioDataUrl);
      if (result.analysis) {
        setAnalysisResult(result.analysis);
      }
      toast({ title: "Effect Applied", description: `${effect?.name || actualHandlerKey} processing complete.` });
    } catch (error) {
      console.error(`Error applying effect ${effectId}:`, error);
      toast({ title: "Processing Error", description: `Could not apply ${effect?.name || effectId}.`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [originalAudioDataUrl, processedAudioDataUrl, toast, effectSettings]);

  const handleExport = useCallback((format: string, quality: string) => {
    // This is mostly a placeholder for now as download is handled by AudioPlayer
    // In a real app, this might trigger specific encoding
    console.log(`Exporting as ${format} with ${quality} quality.`);
    if(!processedAudioDataUrl) {
      toast({ title: "Nothing to Export", description: "No processed audio available.", variant: "destructive"});
      return;
    }
    toast({ title: "Export Initiated", description: `Preparing download for ${format}.` });
  }, [processedAudioDataUrl, toast]);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AppHeader />
      <ResizablePanelGroup direction="horizontal" className="flex-grow min-h-0">
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <AudioControlsPanel
            onFileSelect={handleFileSelect}
            selectedFile={originalAudioFile}
            onApplyEffect={handleApplyEffect}
            onParameterChange={handleParameterChange}
            effectSettings={effectSettings}
            isLoading={isLoading}
            isAudioLoaded={!!originalAudioDataUrl}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65} minSize={50}>
          <MainDisplayPanel
            originalAudioDataUrl={originalAudioDataUrl}
            processedAudioDataUrl={processedAudioDataUrl}
            onExport={handleExport}
            isLoading={isLoading}
            analysisResult={analysisResult}
            originalFileName={originalAudioFile?.name}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
