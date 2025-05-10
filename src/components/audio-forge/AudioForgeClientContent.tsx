
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  
  const [processedAudioBuffer, setProcessedAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [effectSettings, setEffectSettings] = useState<Record<string, EffectSettings>>(() => {
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

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // No global cleanup for audioContextRef here as it's used throughout the component's life.
    // It can be closed on unmount if necessary, but for now, it persists.
    // return () => {
    //   audioContextRef.current?.close().catch(e => console.error("Failed to close AudioContext", e));
    //   audioContextRef.current = null;
    // }
  }, []);

  const loadAudioBufferForVisualizer = useCallback(async (dataUrl: string | null) => {
    if (!dataUrl || !audioContextRef.current) {
      setProcessedAudioBuffer(null);
      return;
    }
    // setIsLoading(true); // This isLoading is for main processing, visualizer is secondary
    try {
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      // Ensure context is active
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
         console.warn("AudioContext was closed, reinitializing for visualizer.");
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      setProcessedAudioBuffer(audioBuffer);
    } catch (error) {
      console.error("Error decoding audio data for visualizer:", error);
      // toast({ title: "Visualizer Error", description: "Could not load audio for visualization.", variant: "destructive" });
      setProcessedAudioBuffer(null);
    } finally {
      // setIsLoading(false);
    }
  }, []); // Removed toast from deps for this specific loader

  useEffect(() => {
    loadAudioBufferForVisualizer(processedAudioDataUrl);
  }, [processedAudioDataUrl, loadAudioBufferForVisualizer]);


  const handleFileSelect = useCallback(async (file: File | null) => {
    setOriginalAudioFile(file);
    if (file) {
      setIsLoading(true);
      try {
        const dataUrl = await fileToDataUrl(file);
        setOriginalAudioDataUrl(dataUrl);
        setProcessedAudioDataUrl(dataUrl); 
        setAnalysisResult(null);
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
      setProcessedAudioBuffer(null); // Clear buffer if file is cleared
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
    setAnalysisResult(null); 
    const currentAudio = processedAudioDataUrl || originalAudioDataUrl; 

    try {
      let result: { processedAudioDataUrl: string; analysis?: string } = { processedAudioDataUrl: currentAudio };
      const effect = effectsList.find(e => e.id === effectId || e.parameters?.find(p => p.handlerKey === effectId));
      const actualHandlerKey = effect?.parameters?.find(p => p.handlerKey === effectId)?.handlerKey || effect?.handlerKey || effectId;
      
      const combinedParams = { ...(effectSettings[effect?.id ?? effectId] || {}), ...params };

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
            audioBuffer={processedAudioBuffer}
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
