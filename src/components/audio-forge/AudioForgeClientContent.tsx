
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppHeader } from './AppHeader';
import { AudioControlsPanel } from './AudioControlsPanel';
import { MainDisplayPanel } from './MainDisplayPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import type { EffectSettings } from '@/types/audio-forge';
import { useToast } from '@/hooks/use-toast';
import { audioUtils, fileToDataUrl } from '@/lib/audio-utils';
import { effectsList } from '@/app/audio-forge/effects';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AudioForgeClientContent() {
  const [originalAudioFile, setOriginalAudioFile] = useState<File | null>(null);
  const [originalAudioDataUrl, setOriginalAudioDataUrl] = useState<string | null>(null);
  const [processedAudioDataUrl, setProcessedAudioDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisSourceEffectId, setAnalysisSourceEffectId] = useState<string | null>(null);
  
  const [processedAudioBuffer, setProcessedAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isMobile = useIsMobile();
  const [isEffectsSheetOpen, setIsEffectsSheetOpen] = useState(false);

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
  }, []);

  const loadAudioBufferForVisualizer = useCallback(async (dataUrl: string | null) => {
    if (!dataUrl || !audioContextRef.current) {
      setProcessedAudioBuffer(null);
      return;
    }
    try {
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
         console.warn("AudioContext was closed, reinitializing for visualizer.");
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      setProcessedAudioBuffer(audioBuffer);
    } catch (error) {
      console.error("Error decoding audio data for visualizer:", error);
      setProcessedAudioBuffer(null);
    }
  }, []); 

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
        setAnalysisSourceEffectId(null);
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
      setAnalysisSourceEffectId(null);
      setProcessedAudioBuffer(null); 
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
    setAnalysisSourceEffectId(null);
    const currentAudio = processedAudioDataUrl || originalAudioDataUrl; 

    try {
      let result: { processedAudioDataUrl: string; analysis?: string } = { processedAudioDataUrl: currentAudio };
      const effectToApply = effectsList.find(e => e.id === effectId || e.parameters?.find(p => p.handlerKey === effectId));
      const actualHandlerKey = effectToApply?.parameters?.find(p => p.handlerKey === effectId)?.handlerKey || effectToApply?.handlerKey || effectId;
      const parentEffectId = effectToApply?.id || null;
      
      const combinedParams = { ...(effectSettings[parentEffectId ?? effectId] || {}), ...params };

      if (audioUtils[actualHandlerKey]) {
        result = await audioUtils[actualHandlerKey](currentAudio, combinedParams);
      } else {
        throw new Error(`Handler for ${actualHandlerKey} not found.`);
      }
      
      setProcessedAudioDataUrl(result.processedAudioDataUrl);
      if (result.analysis) {
        setAnalysisResult(result.analysis);
        if (effectToApply?.outputsAnalysis) {
          setAnalysisSourceEffectId(parentEffectId);
        }
      }
      toast({ title: "Effect Applied", description: `${effectToApply?.name || actualHandlerKey} processing complete.` });
    } catch (error: any) {
      console.error(`Error applying effect ${effectId}:`, error);
      const effectToApply = effectsList.find(e => e.id === effectId || e.parameters?.find(p => p.handlerKey === effectId));
      toast({ title: "Processing Error", description: `Could not apply ${effectToApply?.name || effectId}. ${error.message}`, variant: "destructive" });
      setAnalysisResult(null);
      setAnalysisSourceEffectId(null);
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

  const audioControlsPanelProps = {
    onFileSelect: handleFileSelect,
    selectedFile: originalAudioFile,
    onApplyEffect: handleApplyEffect,
    onParameterChange: handleParameterChange,
    effectSettings: effectSettings,
    isLoading: isLoading,
    isAudioLoaded: !!originalAudioDataUrl,
    analysisResult: analysisResult,
    analysisSourceEffectId: analysisSourceEffectId,
  };

  const mainDisplayPanelProps = {
    originalAudioDataUrl: originalAudioDataUrl,
    processedAudioDataUrl: processedAudioDataUrl,
    audioBuffer: processedAudioBuffer,
    onExport: handleExport,
    isLoading: isLoading,
    analysisResult: analysisResult,
    analysisSourceEffectId: analysisSourceEffectId,
    originalFileName: originalAudioFile?.name,
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <AppHeader 
        isMobile={isMobile}
        onOpenEffectsPanel={() => setIsEffectsSheetOpen(true)}
      />
      <div className="flex-grow min-h-0 md:flex">
        {isMobile ? (
          <>
            <div className="flex-grow p-4 overflow-y-auto">
              <MainDisplayPanel {...mainDisplayPanelProps} />
            </div>
            <Sheet open={isEffectsSheetOpen} onOpenChange={setIsEffectsSheetOpen}>
              <SheetContent side="left" className="w-[85vw] max-w-md p-0 flex flex-col">
                <SheetTitle className="sr-only">Audio Effects Panel</SheetTitle>
                <AudioControlsPanel {...audioControlsPanelProps} />
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <ResizablePanelGroup 
            direction="horizontal"
            className="flex-grow"
          >
            <ResizablePanel 
              defaultSize={30} 
              minSize={20} 
              maxSize={45}
              className="h-full overflow-y-auto"
            >
              <AudioControlsPanel {...audioControlsPanelProps} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel 
              defaultSize={70} 
              minSize={55}
              className="h-full overflow-y-auto"
            >
              <MainDisplayPanel {...mainDisplayPanelProps} />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
