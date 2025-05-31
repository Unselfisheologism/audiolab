
"use client";

import type React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Film, Edit3, Play, Pause } from "lucide-react";
import type { TranscriptLine, BackgroundConfig, VideoTemplateValue, VideoAspectRatio, IconPosition, TranscriptStyleConfig } from '@/types';
import { videoTemplates, defaultTranscriptStyleConfig } from '@/types'; // Import defaultTranscriptStyleConfig
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AudioTranscriptSectionProps {
  transcriptLines: TranscriptLine[];
  onTranscriptChange: (index: number, newText: string) => void;
  audioFileUrl: string | null;
  backgroundConfig: BackgroundConfig | null;
  selectedTemplate: VideoTemplateValue;
  aspectRatio: VideoAspectRatio;
  customIconUrl: string | null;
  useDefaultIcon: boolean;
  iconPosition: IconPosition;
  transcriptPosition: IconPosition;
  transcriptStyleConfig: TranscriptStyleConfig;
}

export default function AudioTranscriptSection({
  transcriptLines,
  onTranscriptChange,
  audioFileUrl,
  backgroundConfig,
  selectedTemplate,
  aspectRatio,
  customIconUrl,
  useDefaultIcon,
  iconPosition,
  transcriptPosition,
  transcriptStyleConfig = defaultTranscriptStyleConfig, // Provide default value here
}: AudioTranscriptSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'video' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);


  const [currentTranscriptLineText, setCurrentTranscriptLineText] = useState<string>("");
  const [currentTranscriptIndex, setCurrentTranscriptIndex] = useState<number>(0);

  const [calculatedFontSize, setCalculatedFontSize] = useState('1rem');


  // Effect to set the displayed transcript text
  useEffect(() => {
    if (transcriptLines.length > 0) {
      const safeIndex = currentTranscriptIndex % transcriptLines.length;
      setCurrentTranscriptLineText(transcriptLines[safeIndex].text);
    } else {
      setCurrentTranscriptLineText("");
    }
  }, [transcriptLines, currentTranscriptIndex]);

  // Effect to cycle through transcript lines ONLY when audio is playing
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isPlaying && transcriptLines.length > 0 && transcriptLines.length > 1) { 
      intervalId = setInterval(() => {
        setCurrentTranscriptIndex(prevIndex => prevIndex + 1);
      }, 3000); 
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, transcriptLines]);

  // Effect to manage background preview source
  useEffect(() => {
    let objectUrl: string | null = null;

    if (backgroundConfig) {
      if (backgroundConfig.type === 'url') {
        setPreviewSrc(backgroundConfig.value);
        if (/\.(mp4|webm|mov)$/i.test(backgroundConfig.value)) {
          setPreviewType('video');
        } else if (/\.(jpeg|jpg|png|gif|webp|avif)$/i.test(backgroundConfig.value)) {
          setPreviewType('image');
        } else {
          setPreviewType(null);
        }
      } else if (backgroundConfig.type === 'file') {
        objectUrl = URL.createObjectURL(backgroundConfig.value);
        setPreviewSrc(objectUrl);
        if (backgroundConfig.value.type.startsWith('video/')) {
          setPreviewType('video');
        } else if (backgroundConfig.value.type.startsWith('image/')) {
          setPreviewType('image');
        } else {
          setPreviewType(null);
        }
      }
    } else {
      setPreviewSrc(null);
      setPreviewType(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [backgroundConfig]);

  // Effect to autoplay background video when its source or type changes
  useEffect(() => {
    if (previewType === 'video' && videoRef.current && previewSrc) {
      if (videoRef.current.src !== previewSrc) {
        videoRef.current.src = previewSrc;
        videoRef.current.load();
      }
      videoRef.current.play().catch(error => console.warn("Background video autoplay was prevented:", error));
    }
  }, [previewSrc, previewType]);

  // Effect to reset audio and transcript index when audioFileUrl changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTranscriptIndex(0); 
    if (transcriptLines.length === 0) { 
        setCurrentTranscriptLineText("");
    } else if (transcriptLines[0]) {
        setCurrentTranscriptLineText(transcriptLines[0].text);
    }
  }, [audioFileUrl, transcriptLines]);

  useEffect(() => {
    const calculateSize = () => {
      // Guard against undefined transcriptStyleConfig or previewContainerRef.current
      if (previewContainerRef.current && transcriptStyleConfig && typeof transcriptStyleConfig.fontSizeRatio === 'number') {
        const containerHeight = previewContainerRef.current.offsetHeight;
        // Ensure fontSizeRatio is treated as a number
        const fontSizeRatio = Number(transcriptStyleConfig.fontSizeRatio) || 0;
        const dynamicSize = Math.max(12, containerHeight * (fontSizeRatio / 1000)); 
        setCalculatedFontSize(`${dynamicSize}px`);
      } else {
        // Fallback font size if config is not available or complete
        setCalculatedFontSize('1rem'); 
      }
    };

    calculateSize(); // Initial calculation
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, [transcriptStyleConfig]); // Depend on the entire transcriptStyleConfig object


  const togglePlay = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        if (audioRef.current.currentTime < 0.1 && transcriptLines.length > 0 && transcriptLines[0]) {
          setCurrentTranscriptIndex(0);
          setCurrentTranscriptLineText(transcriptLines[0].text); 
        }
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTranscriptIndex(0);
     if (transcriptLines.length > 0 && transcriptLines[0]) {
        setCurrentTranscriptLineText(transcriptLines[0].text); 
    } else {
        setCurrentTranscriptLineText("");
    }
  };

  const selectedTemplateData = videoTemplates.find(t => t.value === selectedTemplate);
  
  let finalIconUrl: string | null = null;
  let iconAltText: string = "Template Icon";
  const iconDisplaySize = 32; // Keeping this fixed for simplicity, responsive padding helps.

  if (customIconUrl) {
    finalIconUrl = customIconUrl;
    iconAltText = "Custom Icon";
  } else if (useDefaultIcon && selectedTemplateData?.iconUrl) {
    finalIconUrl = selectedTemplateData.iconUrl;
    iconAltText = `${selectedTemplateData.label} Icon`;
  }


  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-[16/9]';
      case '9:16': return 'aspect-[9/16]';
      case '1:1': return 'aspect-square';
      case '4:3': return 'aspect-[4/3]';
      default: return 'aspect-video';
    }
  };

  const getOverlayElementPositionClasses = (position: IconPosition, isText: boolean = false): string => {
    const baseWrapperClasses = "absolute z-10"; 
    // Adjusted padding: increased padding for text, smaller for icon
    const paddingClasses = isText ? "p-2 sm:p-3 md:p-4" : "p-1"; 
    const backgroundClasses = isText && transcriptStyleConfig?.hasBackground ? "" : (isText ? "" : "bg-black/50 rounded");
    
    let positionClasses = "";
    let textAlignClasses = isText ? "text-center" : ""; // Default text alignment for text

    // Ensure responsive positioning by scaling padding/margins or using percentages if needed
    // For simplicity, using fixed padding with responsive adjustments via Tailwind's breakpoints (sm, md, lg)
    const offsetBase = "2"; // e.g., p-2, m-2
    const offsetMd = "4";   // e.g., md:p-4, md:m-4

    switch (position) {
        case 'top-left':     positionClasses = `top-${offsetBase} left-${offsetBase} md:top-${offsetMd} md:left-${offsetMd}`; if(isText) textAlignClasses="text-left"; break;
        case 'top-center':   positionClasses = `top-${offsetBase} left-1/2 -translate-x-1/2 md:top-${offsetMd}`; break;
        case 'top-right':    positionClasses = `top-${offsetBase} right-${offsetBase} md:top-${offsetMd} md:right-${offsetMd}`; if(isText) textAlignClasses="text-right"; break;
        case 'middle-left':  positionClasses = `top-1/2 left-${offsetBase} -translate-y-1/2 md:left-${offsetMd}`; if(isText) textAlignClasses="text-left"; break;
        case 'center':       positionClasses = `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`; break;
        case 'middle-right': positionClasses = `top-1/2 right-${offsetBase} -translate-y-1/2 md:right-${offsetMd}`; if(isText) textAlignClasses="text-right"; break;
        case 'bottom-left':  positionClasses = `bottom-${offsetBase} left-${offsetBase} md:bottom-${offsetMd} md:left-${offsetMd}`; if(isText) textAlignClasses="text-left"; break;
        case 'bottom-center':positionClasses = `bottom-${offsetBase} left-1/2 -translate-x-1/2 md:bottom-${offsetMd}`; break;
        case 'bottom-right': positionClasses = `bottom-${offsetBase} right-${offsetBase} md:bottom-${offsetMd} md:right-${offsetMd}`; if(isText) textAlignClasses="text-right"; break;
        default:             positionClasses = `top-${offsetBase} left-${offsetBase} md:top-${offsetMd} md:left-${offsetMd}`; if(isText) textAlignClasses="text-left"; 
    }
    
    // Full-width for text if it's top/bottom aligned but not dead center
    if (isText && (position.startsWith('top-') || position.startsWith('bottom-')) && !(position.includes('center'))) {
        positionClasses = `${positionClasses.split(' left-1/2')[0]} left-0 right-0`; 
    }


    return cn(baseWrapperClasses, paddingClasses, backgroundClasses, positionClasses, textAlignClasses);
  };
  
  const transcriptPreviewStyle: React.CSSProperties = transcriptStyleConfig ? {
    color: transcriptStyleConfig.textColor,
    fontFamily: `"${transcriptStyleConfig.fontFamily}", Arial, sans-serif`,
    fontSize: calculatedFontSize,
    fontWeight: transcriptStyleConfig.fontWeight as React.CSSProperties['fontWeight'],
    backgroundColor: transcriptStyleConfig.hasBackground ? transcriptStyleConfig.backgroundColor : 'transparent',
    padding: transcriptStyleConfig.hasBackground ? '0.25em 0.5em' : '0', // Added em padding for background
    borderRadius: transcriptStyleConfig.hasBackground ? '0.25rem' : '0', // Added border radius for background
  } : { fontSize: calculatedFontSize, color: '#FFFFFF' }; // Fallback style

  if (transcriptStyleConfig?.hasTextOutline) {
    transcriptPreviewStyle.WebkitTextStrokeWidth = `${transcriptStyleConfig.textOutlineWidth}px`;
    transcriptPreviewStyle.WebkitTextStrokeColor = transcriptStyleConfig.textOutlineColor;
    transcriptPreviewStyle.paintOrder = 'stroke fill'; 
  }

  if (transcriptStyleConfig?.hasTextShadow) {
    transcriptPreviewStyle.textShadow = `${transcriptStyleConfig.textShadowOffsetX}px ${transcriptStyleConfig.textShadowOffsetY}px ${transcriptStyleConfig.textShadowBlur}px ${transcriptStyleConfig.textShadowColor}`;
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Film className="mr-2 h-6 w-6 text-primary" />
          Video Preview & Transcript
        </CardTitle>
        <CardDescription>Preview your video with current settings and edit the transcript.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Preview</h3>
            {audioFileUrl && (
              <Button variant="ghost" size="icon" onClick={togglePlay} aria-label={isPlaying ? "Pause audio" : "Play audio"}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
            )}
          </div>

          <div ref={previewContainerRef} className={`bg-muted rounded-md flex justify-center items-center relative overflow-hidden w-full ${getAspectRatioClass()}`}>
            {previewSrc && previewType === 'image' && (
              <Image src={previewSrc} alt="Preview background" fill style={{objectFit: 'cover'}} className="rounded-md" data-ai-hint="abstract background" priority />
            )}
            {previewSrc && previewType === 'video' && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-md"
                loop
                muted
                playsInline
              />
            )}
            {!previewSrc && (
              <p className="text-muted-foreground p-4 text-center">Select or upload a background in customization options to see a preview.</p>
            )}

            {audioFileUrl && (
              <audio
                ref={audioRef}
                src={audioFileUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleAudioEnded}
              />
            )}

            {finalIconUrl && previewSrc && (
              <div className={getOverlayElementPositionClasses(iconPosition, false)}>
                <Image src={finalIconUrl} alt={iconAltText} width={iconDisplaySize} height={iconDisplaySize} style={{objectFit: 'contain'}} />
              </div>
            )}

            {previewSrc && currentTranscriptLineText && (
                <div className={getOverlayElementPositionClasses(transcriptPosition, true)}>
                    <p style={transcriptPreviewStyle} className="font-semibold animate-pulse leading-tight">
                      {currentTranscriptLineText}
                    </p>
                </div>
            )}
             {previewSrc && transcriptLines.length === 0 && !currentTranscriptLineText && (
                <div className={getOverlayElementPositionClasses(transcriptPosition, true)}>
                    <p style={{...transcriptPreviewStyle, color: transcriptStyleConfig?.textColor || '#FFFFFF', fontSize: '0.8em' }} className="text-xs sm:text-sm">
                      Upload a transcript to see text here.
                    </p>
                </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <Edit3 className="mr-2 h-5 w-5 text-primary" />
            Transcript Editor
          </h3>
          <ScrollArea className="h-[200px] sm:h-[250px] md:h-[300px] w-full rounded-md border p-4 bg-input/50">
            {transcriptLines.length > 0 ? (
              transcriptLines.map((line, index) => (
                <div key={line.id} className="mb-3">
                  <Label htmlFor={`transcript-line-${index}`} className="text-xs text-muted-foreground">
                    Line {index + 1}
                  </Label>
                  <Textarea
                    id={`transcript-line-${index}`}
                    value={line.text}
                    onChange={(e) => onTranscriptChange(index, e.target.value)}
                    className="w-full resize-none bg-background"
                    rows={2}
                  />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-10">Upload a transcript file to start editing.</p>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

    