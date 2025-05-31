"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Film, AlertTriangle, FileAudio } from "lucide-react";
import { useToast } from '@/hooks/use-toast'; // Assuming audiolab has this
import type { TranscriptLine, VideoTemplateValue, VideoResolution, VideoAspectRatio, BackgroundConfig, IconPosition } from '@/types/audiovizTypes';
import { videoTemplates } from '@/types/audiovizTypes';

interface ExportSectionProps {
  audioFile: File | null;
  backgroundConfig: BackgroundConfig | null;
  transcriptLines: TranscriptLine[];
  selectedTemplate: VideoTemplateValue;
  resolution: VideoResolution;
  aspectRatio: VideoAspectRatio;
  customIconFile: File | null;
  useDefaultIcon: boolean;
  iconPosition: IconPosition;
}

const getOutputDimensions = (resolution: VideoResolution, aspectRatio: VideoAspectRatio): { width: number; height: number } => {
  let targetHeight = 1080;
  if (resolution === '720p') targetHeight = 720;
  else if (resolution === '480p') targetHeight = 480;

  const [arW, arH] = aspectRatio.split(':').map(Number);

  let width = Math.round(targetHeight * (arW / arH));
  let height = targetHeight;

  width = width % 2 === 0 ? width : width + 1;
  height = height % 2 === 0 ? height : height + 1;

  return { width, height };
};

const getIconDrawPosition = (
  iconW: number,
  iconH: number,
  videoW: number,
  videoH: number,
  position: IconPosition,
): { x: number; y: number } => {
  const responsivePadding = Math.max(10, Math.round(videoH * 0.025));

  switch (position) {
    case 'top-left':      return { x: responsivePadding, y: responsivePadding };
    case 'top-center':    return { x: (videoW - iconW) / 2, y: responsivePadding };
    case 'top-right':     return { x: videoW - iconW - responsivePadding, y: responsivePadding };
    case 'middle-left':   return { x: responsivePadding, y: (videoH - iconH) / 2 };
    case 'center':        return { x: (videoW - iconW) / 2, y: (videoH - iconH) / 2 };
    case 'middle-right':  return { x: videoW - iconW - responsivePadding, y: (videoH - iconH) / 2 };
    case 'bottom-left':   return { x: responsivePadding, y: videoH - iconH - responsivePadding };
    case 'bottom-center': return { x: (videoW - iconW) / 2, y: videoH - iconH - responsivePadding };
    case 'bottom-right':  return { x: videoW - iconW - responsivePadding, y: videoH - iconH - responsivePadding };
    default:              return { x: responsivePadding, y: responsivePadding };
  }
};

const getSimplifiedTranscriptDrawCoordinates = (
  canvasWidth: number,
  canvasHeight: number,
  fontSize: number,
  textMetrics: TextMetrics
): { x: number; y: number; textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline } => {
  const verticalMargin = Math.round(canvasHeight * 0.04);
  const x = canvasWidth / 2;
  const y = canvasHeight - verticalMargin - (fontSize * 0.2);
  return { x, y, textAlign: 'center', textBaseline: 'bottom' };
};


export default function ExportSection({
  audioFile,
  backgroundConfig,
  transcriptLines,
  selectedTemplate,
  resolution,
  aspectRatio,
  customIconFile,
  useDefaultIcon,
  iconPosition,
}: ExportSectionProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    };
  }, []);

  const getAudioDuration = async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const localAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result || !(e.target.result instanceof ArrayBuffer)) {
          localAudioContext.close();
          return reject(new Error("Failed to read audio file for duration check."));
        }
        localAudioContext.decodeAudioData(e.target.result as ArrayBuffer)
          .then(buffer => {
            localAudioContext.close();
            resolve(buffer.duration);
          })
          .catch(err => {
            localAudioContext.close();
            console.error("Error decoding audio data for duration:", err);
            reject(new Error("Could not determine audio duration. Ensure it's a valid audio file."));
          });
      };
      reader.onerror = (err) => {
        localAudioContext.close();
        console.error("FileReader error for duration check:", err);
        reject(new Error("Could not read audio file for duration check."));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const loadImage = (src: string | File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => {
        console.error('Image load error:', err, src);
        reject(new Error(`Failed to load image from ${typeof src === 'string' ? src : src.name}`));
      };
      if (typeof src === 'string') {
        img.src = src;
      } else {
        const objectURL = URL.createObjectURL(src);
        img.src = objectURL;
        const originalOnLoad = img.onload;
        img.onload = (e) => {
          URL.revokeObjectURL(objectURL);
          if (originalOnLoad) (originalOnLoad as EventListener).call(img, e);
        };
        const originalOnError = img.onerror;
        img.onerror = (e) => {
          URL.revokeObjectURL(objectURL);
          if (originalOnError) (originalOnError as OnErrorEventHandler).call(img, e, '',0,0,null);
        };
      }
    });
  };

  const drawFrame = useCallback((
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    currentBgImage: HTMLImageElement | null,
    currentIconImage: HTMLImageElement | null,
    currentTranscriptText: string,
    currentIconPosition: IconPosition,
  ) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (currentBgImage) {
      const imgAspectRatio = currentBgImage.width / currentBgImage.height;
      const canvasAspectRatioValue = canvasWidth / canvasHeight;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspectRatio > canvasAspectRatioValue) {
        drawHeight = canvasHeight;
        drawWidth = drawHeight * imgAspectRatio;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = canvasWidth;
        drawHeight = drawWidth / imgAspectRatio;
        offsetY = (canvasHeight - drawHeight) / 2;
        offsetX = 0;
      }
      ctx.drawImage(currentBgImage, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      ctx.fillStyle = '#CCCCCC';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    if (currentIconImage) {
      const iconTargetHeight = Math.round(canvasHeight * 0.07);
      const iconAspectRatio = currentIconImage.width / currentIconImage.height;
      const iconDrawHeight = iconTargetHeight;
      const iconDrawWidth = iconTargetHeight * iconAspectRatio;

      const { x, y } = getIconDrawPosition(iconDrawWidth, iconDrawHeight, canvasWidth, canvasHeight, currentIconPosition);

      const iconBgPadding = Math.max(5, Math.round(iconDrawHeight * 0.1));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      const cornerRadius = Math.max(3, Math.round(iconDrawHeight * 0.05));
      ctx.beginPath();
      ctx.roundRect(x - iconBgPadding, y - iconBgPadding, iconDrawWidth + 2 * iconBgPadding, iconDrawHeight + 2 * iconBgPadding, cornerRadius);
      ctx.fill();

      ctx.drawImage(currentIconImage, x, y, iconDrawWidth, iconDrawHeight);
    }

    if (currentTranscriptText) {
      const fontSize = Math.max(16, Math.round(canvasHeight / 28));
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;

      const textMetrics = ctx.measureText(currentTranscriptText || " ");
      const { x: textX, y: textY, textAlign, textBaseline } = getSimplifiedTranscriptDrawCoordinates(
        canvasWidth, canvasHeight, fontSize, textMetrics
      );

      ctx.strokeStyle = 'black';
      ctx.lineWidth = Math.max(1, fontSize / 15);
      ctx.lineJoin = 'round';
      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;
      ctx.strokeText(currentTranscriptText, textX, textY);

      ctx.fillStyle = 'white';
      ctx.fillText(currentTranscriptText, textX, textY);
    }
  }, []);


  const handleExport = async () => {
    if (!audioFile) {
      toast({ variant: "destructive", title: "Audio Missing", description: "Please upload an audio file to enable export." });
      return;
    }
    if (isMounted && typeof MediaRecorder === 'undefined') {
      toast({ variant: "destructive", title: "Browser Not Supported", description: "MediaRecorder API is not available." });
      return;
    }
    if (isExporting) {
        return;
    }

    let audioObjectUrl: string | null = null;
    let localAudioElement: HTMLAudioElement | null = null;

    try {
      setIsExporting(true);
      setExportProgress(0);
      recordedChunksRef.current = [];

      const mimeTypes = [
          'video/webm; codecs=vp9,opus', 'video/webm; codecs=vp8,opus',
          'video/webm; codecs=vp9', 'video/webm; codecs=vp8', 'video/webm',
      ];
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

      if (!supportedMimeType) {
        toast({variant: "destructive", title: "Format Support Error", description: "WEBM format not supported by your browser for recording."});
        setIsExporting(false);
        return;
      }

      const audioDuration = await getAudioDuration(audioFile);
      const outputDims = getOutputDimensions(resolution, aspectRatio);

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = outputDims.width;
      offscreenCanvas.height = outputDims.height;
      const ctx = offscreenCanvas.getContext('2d', { alpha: false });
      if (!ctx) {
        throw new Error("Could not get 2D context from offscreen canvas for recording.");
      }
      canvasRef.current = offscreenCanvas;

      let bgImage: HTMLImageElement | null = null;
      if (backgroundConfig) {
        try {
          if (backgroundConfig.type === 'file' && backgroundConfig.value.type.startsWith('image/')) {
            bgImage = await loadImage(backgroundConfig.value);
          } else if (backgroundConfig.type === 'url' && /\.(jpeg|jpg|png|gif|webp|avif)$/i.test(backgroundConfig.value)) {
            bgImage = await loadImage(backgroundConfig.value);
          } else if (backgroundConfig.type === 'url' && (/\.(mp4|webm|mov)$/i.test(backgroundConfig.value) || backgroundConfig.value.startsWith('data:video')) ){
             toast({variant: "default", title:"Background Info", description:"Video backgrounds are not used for this export method. Using fallback color."});
          } else if (backgroundConfig.type === 'file' && backgroundConfig.value.type.startsWith('video/')) {
             toast({variant: "default", title:"Background Info", description:"Video backgrounds are not used for this export method. Using fallback color."});
          }
        } catch (e: any) {
          toast({ variant: "destructive", title: "Background Load Error", description: `Could not load background: ${e.message}. Using fallback color for export.` });
        }
      }

      let iconImage: HTMLImageElement | null = null;
      const templateData = videoTemplates.find(t => t.value === selectedTemplate);
      if (customIconFile) {
        try { iconImage = await loadImage(customIconFile); }
        catch (e: any) { console.error("Error loading custom icon for recording:", e.message); }
      } else if (useDefaultIcon && templateData?.iconUrl) {
        try { iconImage = await loadImage(templateData.iconUrl); }
        catch (e: any) { console.error("Error loading default icon for recording:", e.message); }
      }

      const initialTextToDraw = transcriptLines[0]?.text || (transcriptLines.length > 0 && transcriptLines[0] ? transcriptLines[0].text : " ");
      drawFrame(ctx, outputDims.width, outputDims.height, bgImage, iconImage, initialTextToDraw, iconPosition);

      localAudioElement = document.createElement('audio');
      audioObjectUrl = URL.createObjectURL(audioFile);
      localAudioElement.src = audioObjectUrl;
      localAudioElement.muted = false;

      await new Promise<void>((resolvePromise, rejectPromise) => {
        if (!localAudioElement) {
          rejectPromise(new Error("Audio element for recording is null."));
          return;
        }
        localAudioElement.onloadedmetadata = () => { resolvePromise(); };
        localAudioElement.onerror = () => {
            rejectPromise(new Error("Failed to load audio metadata for recording."));
        };
      });
      audioRef.current = localAudioElement;

      const videoStream = offscreenCanvas.captureStream(30);

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

      const sourceNode = audioContextRef.current.createMediaElementSource(localAudioElement);
      const destNode = audioContextRef.current.createMediaStreamDestination();
      sourceNode.connect(destNode);
      sourceNode.connect(audioContextRef.current.destination);
      const audioStreamTracks = destNode.stream.getAudioTracks();

      if (!audioStreamTracks || audioStreamTracks.length === 0) {
        throw new Error("Could not capture audio stream from the audio element for recording.");
      }

      const combinedStream = new MediaStream([...videoStream.getVideoTracks(), ...audioStreamTracks]);
      mediaRecorderRef.current = new MediaRecorder(combinedStream, { mimeType: supportedMimeType });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.error("Error closing audio context onstop:", e));
        }
        if (audioObjectUrl) {
            URL.revokeObjectURL(audioObjectUrl);
            audioObjectUrl = null;
        }
        if (recordedChunksRef.current.length === 0) {
          toast({ variant: "destructive", title: "Recording Error", description: "No video data was recorded. Please try again." });
        } else {
          const blob = new Blob(recordedChunksRef.current, { type: supportedMimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `audioviz_export_${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast({ title: "Export Complete!", description: "Your video has been downloaded." });
        }
        setExportProgress(100);
        setIsExporting(false);
      };

      mediaRecorderRef.current.onerror = (event: any) => {
        toast({variant: "destructive", title:"Recording Error", description: `An error occurred: ${event.error?.message || event.error?.name || 'Unknown recording error'}`});
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(e => console.error("Error closing audio context onerror:", e));
        }
        if (audioObjectUrl) {
            URL.revokeObjectURL(audioObjectUrl);
            audioObjectUrl = null;
        }
        setIsExporting(false);
      };

      let currentTranscriptAnimIndex = 0;
      let lastTranscriptUpdateTime = 0;
      const transcriptInterval = 3000; // ms
      let animationStartTime = 0;

      const renderLoop = (timestamp: number) => {
        try {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording" || !audioRef.current ) {
              if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
              return;
            }
             if (audioRef.current.ended && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
                return;
            }

            if (animationStartTime === 0) animationStartTime = timestamp;
            const elapsedTime = timestamp - animationStartTime;

            if (elapsedTime - lastTranscriptUpdateTime > transcriptInterval && transcriptLines.length > 1) {
                currentTranscriptAnimIndex = (currentTranscriptAnimIndex + 1);
                lastTranscriptUpdateTime = elapsedTime;
            }
            const textIndex = transcriptLines.length > 0 ? currentTranscriptAnimIndex % transcriptLines.length : 0;
            const currentTextToDraw = transcriptLines[textIndex]?.text || (transcriptLines.length > 0 && transcriptLines[textIndex] ? transcriptLines[textIndex].text : " ");

            const currentCtx = canvasRef.current?.getContext('2d');
            if (currentCtx) {
                drawFrame(currentCtx, outputDims.width, outputDims.height, bgImage, iconImage, currentTextToDraw, iconPosition);
            }

            if (audioRef.current && audioDuration > 0) {
                const progress = (audioRef.current.currentTime / audioDuration) * 100;
                setExportProgress(Math.min(100, progress));
            }
            animationFrameIdRef.current = requestAnimationFrame(renderLoop);
        } catch (renderError) {
            toast({variant: "destructive", title: "Render Loop Error", description: "An error occurred during video frame generation."});
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop();
            if (audioRef.current && !audioRef.current.paused) audioRef.current.pause();
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            setIsExporting(false);
        }
      };

      audioRef.current.onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      };

      mediaRecorderRef.current.onstart = () => {};

      mediaRecorderRef.current.start(1000);

      audioRef.current.currentTime = 0;
      try {
        await audioRef.current.play();
      } catch (playError) {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
             audioContextRef.current.close().catch(e => console.error("Error closing audio context on playError:", e));
        }
        if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
        throw playError;
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
      toast({ title: "Recording Started...", description: "The export will take as long as the audio plays." });

    } catch (error: any) {
      toast({ variant: "destructive", title: "Export Failed", description: error.message || "An unexpected error occurred during video processing setup." });
      setExportProgress(0);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(e => console.error("Error closing audio context in main catch:", e));
      }
      if (audioObjectUrl) {
          URL.revokeObjectURL(audioObjectUrl);
      }

      audioRef.current = null;
      mediaRecorderRef.current = null;
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      const mediaRecorderSupported = typeof MediaRecorder !== 'undefined';
      const buttonDisabled = isExporting || !audioFile || !mediaRecorderSupported;
    }
  }, [isMounted, isExporting, audioFile]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Film className="mr-2 h-6 w-6 text-primary" />
          Export Video
        </CardTitle>
        <CardDescription>
          Create your video. The process will take as long as your audio file plays.
          {isMounted && !audioFile && (
            <span className="block mt-1 text-sm text-muted-foreground">
              <FileAudio className="inline h-4 w-4 mr-1" />
              Please upload an audio file to enable export.
            </span>
          )}
          {isMounted && typeof MediaRecorder === 'undefined' && (
            <span className="block mt-1 text-sm text-destructive">
              <AlertTriangle className="inline h-4 w-4 mr-1" />
              Video recording API not supported by your browser. Export is disabled.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleExport}
          disabled={isExporting || !audioFile || (isMounted && typeof MediaRecorder === 'undefined')}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg py-6"
        >
          <Download className="mr-2 h-5 w-5" />
          {isExporting ? `Recording... ${exportProgress.toFixed(0)}%` : "Export Video"}
        </Button>
        {isExporting && (
          <Progress value={exportProgress} className="w-full h-3" />
        )}
      </CardContent>
    </Card>
  );
}
