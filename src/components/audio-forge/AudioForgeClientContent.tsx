'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppHeader } from '@/components/audio-forge/AppHeader';
import { AudioControlsPanel } from './AudioControlsPanel';
import { MainDisplayPanel } from './MainDisplayPanel';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { EffectSettings } from '@/types/audio-forge';
import { useToast } from '@/hooks/use-toast';
import { effectsList } from '@/app/audio-forge/effects';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { AppFooter } from './AppFooter';
import { EffectsPanel } from './EffectsPanel';
import { FileUploadArea } from './FileUploadArea';

export default function AudioForgeClientContent() {
  const [originalAudioFile, setOriginalAudioFile] = useState<File | null>(null);
  const [originalAudioDataUrl, setOriginalAudioDataUrl] = useState<string | null>(null);
  const [processedAudioDataUrl, setProcessedAudioDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisSourceEffectId, setAnalysisSourceEffectId] = useState<string | null>(null);
  
  const [originalAudioBuffer, setOriginalAudioBuffer] = useState<AudioBuffer | null>(null);
  const [processedAudioBuffer, setProcessedAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isMobile = useIsMobile();
  const [isEffectsSheetOpen, setIsEffectsSheetOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const audioWorker = useRef<Worker | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    // Initialize AudioContext for main thread playback and visualizer
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Initialize Web Worker
    if (typeof window !== 'undefined' && !audioWorker.current) {
      audioWorker.current = new Worker(new URL('../../workers/audioWorker.ts', import.meta.url));
      
      audioWorker.current.onmessage = (event) => {
        // This will be implemented in the next step
      };
    }
  }, []);


  const loadAudioBuffer = useCallback(async (dataUrl: string | null, setBuffer: React.Dispatch<React.SetStateAction<AudioBuffer | null>>) => {
    if (!dataUrl || !audioContextRef.current) {
      setBuffer(null);
      return;
    }
    try {
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
         console.warn("AudioContext was closed, reinitializing for visualizer.");
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioBufferInstance = await audioContextRef.current.decodeAudioData(arrayBuffer);
      setBuffer(audioBufferInstance);
    } catch (error) {
      console.error("Error decoding audio data for visualizer:", error);
      setBuffer(null);
    }
  }, []); 

  useEffect(() => {
    loadAudioBuffer(originalAudioDataUrl, setOriginalAudioBuffer);
  }, [originalAudioDataUrl, loadAudioBuffer]);

  useEffect(() => {
    loadAudioBuffer(processedAudioDataUrl, setProcessedAudioBuffer);
  }, [processedAudioDataUrl, loadAudioBuffer]);


  const handleFileSelect = useCallback(async (file: File | null) => {
    setOriginalAudioFile(file);
    if (file) {
      setIsLoading(true);
      try {
        // Use Blob URL for large files
        const blobUrl = URL.createObjectURL(file);
        setOriginalAudioDataUrl(blobUrl);
        setProcessedAudioDataUrl(blobUrl);
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
      // Release Blob URLs to free memory
      if (originalAudioDataUrl) URL.revokeObjectURL(originalAudioDataUrl);
      if (processedAudioDataUrl) URL.revokeObjectURL(processedAudioDataUrl);
      setOriginalAudioDataUrl(null);
      setProcessedAudioDataUrl(null);
      setAnalysisResult(null);
      setAnalysisSourceEffectId(null);
      setOriginalAudioBuffer(null);
      setProcessedAudioBuffer(null); 
    }
  }, [toast, originalAudioDataUrl, processedAudioDataUrl]);

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

    if (!audioWorker.current || !currentAudio) {
       toast({ title: "System Error", description: "Audio processing worker is not available.", variant: "destructive" });
       setIsLoading(false);
       return;
    }

    const effectToApply = effectsList.find(e => e.id === effectId || e.parameters?.find(p => p.handlerKey === effectId));
    // Pass the actual effect ID or handler key if it's a preset
    const handlerKey = effectToApply?.parameters?.find(p => p.handlerKey === effectId)?.handlerKey || effectToApply?.handlerKey || effectId;
    const parentEffectId = effectToApply?.id || null;

    try {
      const combinedParams = { ...(effectSettings[parentEffectId ?? effectId] || {}), ...params };

      audioWorker.current.postMessage({
        type: 'applyEffect',
        effectId: handlerKey, // Send the handler key
        audioDataUrl: currentAudio,
        params: combinedParams,
      });

    } catch (error: any) {
      console.error(`Error applying effect ${effectId}:`, error);
      toast({ title: "Processing Error", description: `Could not apply ${effectToApply?.name || effectId}. ${error.message || 'Unknown error'}`, variant: "destructive" });
      setAnalysisResult(null);
      setAnalysisSourceEffectId(null);
    } finally {
      setIsLoading(false);
    }
  }, [originalAudioDataUrl, processedAudioDataUrl, toast, effectSettings]);

  const handleExport = useCallback(async (format: string, quality: string, loopCount: number) => {
    console.log(`Exporting as ${format} with ${quality} quality, loops: ${loopCount}.`);
    if (!processedAudioDataUrl) {
      toast({ title: "Nothing to Export", description: "No processed audio available.", variant: "destructive" });
      return;
    }

    if (!audioWorker.current) {
       toast({ title: "System Error", description: "Audio processing worker is not available.", variant: "destructive" });
       return;
    }

    setIsLoading(true);

    // Send a message to the worker to handle the export
    audioWorker.current.postMessage({
      type: 'exportAudio',
      audioDataUrl: processedAudioDataUrl,
      format: format,
      quality: quality,
      loopCount: loopCount,
      originalFileName: originalAudioFile?.name // Pass original name for filename suggestion
    });

    try {
    } catch (error: any) {
      console.error("Error during export:", error);
      toast({ title: "Export Error", description: `Failed to export audio. ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [processedAudioDataUrl, originalAudioFile, toast]);

  const ControlsPanelSkeleton = () => (
    <div className="p-4 space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );

  const MainContentSkeleton = () => (
    <div className="flex-grow p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" /> 
        <Skeleton className="h-48 w-full" /> 
      </div>
       <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" /> 
      </div>
      <Skeleton className="h-40 w-full md:col-span-2" />
    </div>
  );


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
    originalAudioBuffer: originalAudioBuffer,
    processedAudioBuffer: processedAudioBuffer,
    onExport: handleExport,
    isLoading: isLoading,
    analysisResult: analysisResult,
    analysisSourceEffectId: analysisSourceEffectId,
    originalFileName: originalAudioFile?.name,
  };

  if (!hasMounted) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <AppHeader 
          isMobile={isMobile} 
          onOpenEffectsPanel={() => setIsEffectsSheetOpen(true)}
        />
          {isMobile ? (
             <div className="flex-grow p-4 overflow-y-auto">
                <MainContentSkeleton />
             </div>
          ) : (
            <ResizablePanelGroup direction="horizontal" className="flex-grow">
              <ResizablePanel defaultSize={30} minSize={20} maxSize={45} className="h-full overflow-y-auto">
                 <ControlsPanelSkeleton />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={70} minSize={55} className="h-full overflow-y-auto">
                 <MainContentSkeleton />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader 
        isMobile={isMobile}
        onOpenEffectsPanel={() => setIsEffectsSheetOpen(true)}
      />
        {isMobile ? (
          <>
            <MainDisplayPanel {...mainDisplayPanelProps} />
            <Sheet open={isEffectsSheetOpen} onOpenChange={setIsEffectsSheetOpen}>
              <SheetContent side="left" className="w-[85vw] max-w-md p-0 flex flex-col h-full">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>
                    <h2 className="text-xl font-bold">Audio Effects</h2>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Panel containing all audio effects and file upload controls.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <FileUploadArea
                    onFileSelect={handleFileSelect}
                    selectedFile={originalAudioFile}
                    isLoading={isLoading}
                  />
                  <EffectsPanel
                    onApplyEffect={handleApplyEffect}
                    onParameterChange={handleParameterChange}
                    effectSettings={effectSettings}
                    isLoading={isLoading}
                    isAudioLoaded={!!originalAudioDataUrl}
                    analysisResult={analysisResult}
                    analysisSourceEffectId={analysisSourceEffectId}
                  />
                </div>
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
              <div className="p-4 space-y-4">
                {/* H2 for Effects panel, only visible on desktop */}
                <h2 className="text-lg font-bold mb-4 hidden md:block">Audio Effects</h2>
                <FileUploadArea
                  onFileSelect={handleFileSelect}
                  selectedFile={originalAudioFile}
                  isLoading={isLoading}
                />
                <EffectsPanel
                  onApplyEffect={handleApplyEffect}
                  onParameterChange={handleParameterChange}
                  effectSettings={effectSettings}
                  isLoading={isLoading}
                  isAudioLoaded={!!originalAudioDataUrl}
                  analysisResult={analysisResult}
                  analysisSourceEffectId={analysisSourceEffectId}
                />
              </div>
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
      <AppFooter />
    </div>
  );
}
