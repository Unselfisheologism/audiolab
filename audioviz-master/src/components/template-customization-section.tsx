
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, Image as ImageIcon, MonitorSmartphone, Ratio, PuzzleIcon, Move, Type as TypeIcon, Palette, Blend } from "lucide-react";
import type { VideoTemplateValue, VideoResolution, VideoAspectRatio, BackgroundConfig, IconPosition, TranscriptStyleConfig } from '@/types';
import { videoTemplates, videoResolutions, videoAspectRatios, fontFamilies, defaultTranscriptStyleConfig } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import IconPositionSelector from './icon-position-selector';
import { Skeleton } from "@/components/ui/skeleton";


interface TemplateCustomizationSectionProps {
  selectedTemplate: VideoTemplateValue;
  onTemplateChange: (template: VideoTemplateValue) => void;
  backgroundConfig: BackgroundConfig | null;
  onBackgroundConfigChange: (config: BackgroundConfig | null) => void;
  resolution: VideoResolution;
  onResolutionChange: (resolution: VideoResolution) => void;
  aspectRatio: VideoAspectRatio;
  onAspectRatioChange: (ratio: VideoAspectRatio) => void;
  customIconFile: File | null;
  onCustomIconFileChange: (file: File | null) => void;
  useDefaultIcon: boolean;
  onUseDefaultIconChange: (use: boolean) => void;
  iconPosition: IconPosition;
  onIconPositionChange: (position: IconPosition) => void;
  transcriptPosition: IconPosition;
  onTranscriptPositionChange: (position: IconPosition) => void;
  transcriptStyleConfig?: TranscriptStyleConfig; // Optional for SSR robustness
  onTranscriptStyleConfigChange: (config: TranscriptStyleConfig) => void;
}

export default function TemplateCustomizationSection({
  selectedTemplate,
  onTemplateChange,
  backgroundConfig,
  onBackgroundConfigChange,
  resolution,
  onResolutionChange,
  aspectRatio,
  onAspectRatioChange,
  customIconFile,
  onCustomIconFileChange,
  useDefaultIcon,
  onUseDefaultIconChange,
  iconPosition,
  onIconPositionChange,
  transcriptPosition,
  onTranscriptPositionChange,
  transcriptStyleConfig: actualTranscriptStyleConfigFromProp, // Renamed for clarity
  onTranscriptStyleConfigChange,
}: TemplateCustomizationSectionProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'file'>(backgroundConfig?.type ?? 'url');
  const [backgroundFileInputKey, setBackgroundFileInputKey] = useState(Date.now());
  const [customIconFileInputKey, setCustomIconFileInputKey] = useState(Date.now());

  // Robustly define the style configuration to be used internally.
  // This is crucial for SSR safety.
  const styleConfigForRender = actualTranscriptStyleConfigFromProp || defaultTranscriptStyleConfig;


  useEffect(() => {
    const currentType = backgroundConfig?.type ?? 'url';
    setActiveTab(currentType);
    if (currentType === 'url') {
      setBackgroundFileInputKey(Date.now());
    }
  }, [backgroundConfig?.type]);

  const handleStyleChange = <K extends keyof TranscriptStyleConfig>(
    key: K,
    value: TranscriptStyleConfig[K]
  ) => {
    // Use styleConfigForRender as the base for updates to ensure consistency
    onTranscriptStyleConfigChange({
      ...(styleConfigForRender), 
      [key]: value,
    });
  };
  
  const renderStyleControls = (configToUse: TranscriptStyleConfig) => {
    // configToUse is guaranteed to be defined here due to the logic above.
    return ( 
    <>
      <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
              <Label htmlFor="transcript-text-color" className="text-sm font-medium flex items-center">
                  <Palette className="mr-2 h-4 w-4 text-primary" /> Text Color
              </Label>
              <Input id="transcript-text-color" type="color" value={configToUse.textColor} onChange={(e) => handleStyleChange('textColor', e.target.value)} className="h-10 p-1"/>
          </div>
          <div className="space-y-2">
              <Label htmlFor="transcript-font-weight" className="text-sm font-medium">Font Weight</Label>
              <Select value={configToUse.fontWeight} onValueChange={(val) => handleStyleChange('fontWeight', val as 'normal' | 'bold')}>
                  <SelectTrigger id="transcript-font-weight"><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
              </Select>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="transcript-font-family" className="text-sm font-medium">Font Family</Label>
          <Select value={configToUse.fontFamily} onValueChange={(val) => handleStyleChange('fontFamily', val)}>
            <SelectTrigger id="transcript-font-family"><SelectValue /></SelectTrigger>
            <SelectContent>
              {fontFamilies.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
          <div className="space-y-2">
          <Label htmlFor="transcript-font-size-ratio" className="text-sm font-medium">
              Font Size Factor <span className="text-xs text-muted-foreground">(adjusts relative size)</span>
          </Label>
          <Input
              id="transcript-font-size-ratio"
              type="number"
              value={configToUse.fontSizeRatio}
              onChange={(e) => handleStyleChange('fontSizeRatio', parseInt(e.target.value, 10) || 0)}
              min="1"
              max="100"
              className="h-10"
          />
        </div>
      </div>

      <div className="space-y-3 border-t pt-4">
          <div className="flex items-center space-x-2">
              <Checkbox id="transcript-has-background" checked={configToUse.hasBackground} onCheckedChange={(checked) => handleStyleChange('hasBackground', Boolean(checked))} />
              <Label htmlFor="transcript-has-background" className="text-sm font-medium">Enable Text Background</Label>
          </div>
          {configToUse.hasBackground && (
              <div className="space-y-2 pl-6">
                  <Label htmlFor="transcript-background-color" className="text-sm font-medium flex items-center">
                      <Blend className="mr-2 h-4 w-4 text-primary" /> Background Color
                  </Label>
                  <Input id="transcript-background-color" type="color" value={configToUse.backgroundColor} onChange={(e) => handleStyleChange('backgroundColor', e.target.value)} className="h-10 p-1"/>
              </div>
          )}
      </div>

      <div className="space-y-3 border-t pt-4">
          <div className="flex items-center space-x-2">
              <Checkbox id="transcript-has-outline" checked={configToUse.hasTextOutline} onCheckedChange={(checked) => handleStyleChange('hasTextOutline', Boolean(checked))} />
              <Label htmlFor="transcript-has-outline" className="text-sm font-medium">Enable Text Outline</Label>
          </div>
          {configToUse.hasTextOutline && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                      <Label htmlFor="transcript-outline-color" className="text-sm font-medium">Outline Color</Label>
                      <Input id="transcript-outline-color" type="color" value={configToUse.textOutlineColor} onChange={(e) => handleStyleChange('textOutlineColor', e.target.value)} className="h-10 p-1"/>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="transcript-outline-width" className="text-sm font-medium">Outline Width (px)</Label>
                      <Input id="transcript-outline-width" type="number" value={configToUse.textOutlineWidth} onChange={(e) => handleStyleChange('textOutlineWidth', parseFloat(e.target.value))} min="0.1" step="0.1" className="h-10"/>
                  </div>
              </div>
          )}
      </div>

      <div className="space-y-3 border-t pt-4">
          <div className="flex items-center space-x-2">
              <Checkbox id="transcript-has-shadow" checked={configToUse.hasTextShadow} onCheckedChange={(checked) => handleStyleChange('hasTextShadow', Boolean(checked))} />
              <Label htmlFor="transcript-has-shadow" className="text-sm font-medium">Enable Text Shadow</Label>
          </div>
          {configToUse.hasTextShadow && (
              <div className="space-y-4 pl-6">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="transcript-shadow-color" className="text-sm font-medium">Shadow Color</Label>
                          <Input id="transcript-shadow-color" type="color" value={configToUse.textShadowColor} onChange={(e) => handleStyleChange('textShadowColor', e.target.value)} className="h-10 p-1"/>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="transcript-shadow-blur" className="text-sm font-medium">Shadow Blur (px)</Label>
                          <Input id="transcript-shadow-blur" type="number" value={configToUse.textShadowBlur} onChange={(e) => handleStyleChange('textShadowBlur', parseFloat(e.target.value))} min="0" step="0.1" className="h-10"/>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="transcript-shadow-offset-x" className="text-sm font-medium">Shadow Offset X (px)</Label>
                          <Input id="transcript-shadow-offset-x" type="number" value={configToUse.textShadowOffsetX} onChange={(e) => handleStyleChange('textShadowOffsetX', parseFloat(e.target.value))} step="0.1" className="h-10"/>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="transcript-shadow-offset-y" className="text-sm font-medium">Shadow Offset Y (px)</Label>
                          <Input id="transcript-shadow-offset-y" type="number" value={configToUse.textShadowOffsetY} onChange={(e) => handleStyleChange('textShadowOffsetY', parseFloat(e.target.value))} step="0.1" className="h-10"/>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </>
    );
  }
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Settings2 className="mr-2 h-6 w-6 text-primary" />
          Customize Your Video
        </CardTitle>
        <CardDescription>Choose a template and adjust settings for the perfect output.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="template-select" className="text-base font-medium">Select Template</Label>
          <Select value={selectedTemplate} onValueChange={(value) => onTemplateChange(value as VideoTemplateValue)}>
            <SelectTrigger id="template-select">
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {videoTemplates.map(template => (
                <SelectItem key={template.value} value={template.value}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-medium flex items-center">
            <ImageIcon className="mr-2 h-5 w-5 text-primary" /> Background (Image/Video)
          </Label>
          <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as 'url' | 'file')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="file">Upload File</TabsTrigger>
            </TabsList>
            <TabsContent value="url" className="mt-2">
              <Input
                id="background-url"
                type="url"
                placeholder="https://example.com/image.png or /video.mp4"
                value={backgroundConfig?.type === 'url' ? backgroundConfig.value : ''}
                onChange={(e) => onBackgroundConfigChange({ type: 'url', value: e.target.value })}
              />
            </TabsContent>
            <TabsContent value="file" className="mt-2">
              <Input
                key={backgroundFileInputKey}
                id="background-file"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onBackgroundConfigChange({ type: 'file', value: e.target.files[0] });
                  }
                }}
                className="file:text-primary file:font-semibold"
              />
              {backgroundConfig?.type === 'file' && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  Selected: {backgroundConfig.value.name} ({(backgroundConfig.value.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Accordion type="multiple" className="w-full space-y-2">
          <AccordionItem value="icon-settings" className="border rounded-md px-4">
            <AccordionTrigger className="text-base font-medium flex items-center py-3 hover:no-underline">
              <PuzzleIcon className="mr-2 h-5 w-5 text-primary" /> Icon Settings
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="use-default-icon"
                  checked={useDefaultIcon && !customIconFile}
                  onCheckedChange={(checked) => {
                    const isChecked = Boolean(checked);
                    onUseDefaultIconChange(isChecked);
                    if (isChecked) {
                      onCustomIconFileChange(null);
                      setCustomIconFileInputKey(Date.now());
                    }
                  }}
                />
                <Label htmlFor="use-default-icon">Use default template icon</Label>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <div>
                <Label htmlFor="custom-icon-upload" className="text-sm font-medium">Upload Custom Icon</Label>
                <Input
                  id="custom-icon-upload"
                  type="file"
                  key={customIconFileInputKey}
                  accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    onCustomIconFileChange(file || null);
                    if (file) {
                      onUseDefaultIconChange(false);
                    }
                  }}
                  className="file:text-primary file:font-semibold mt-1"
                />
                {customIconFile && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground truncate">
                      Using: {customIconFile.name}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => {
                      onCustomIconFileChange(null);
                      setCustomIconFileInputKey(Date.now());
                    }}>
                      Remove Custom Icon
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2 mt-4">
                  <Label className="text-sm font-medium flex items-center">
                      <Move className="mr-2 h-4 w-4 text-primary" /> Icon Position
                  </Label>
                  <IconPositionSelector selectedPosition={iconPosition} onPositionChange={onIconPositionChange} />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="transcript-settings" className="border rounded-md px-4">
            <AccordionTrigger className="text-base font-medium flex items-center py-3 hover:no-underline">
                <TypeIcon className="mr-2 h-5 w-5 text-primary" /> Transcript Text Settings
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4 space-y-6">
                <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                        <Move className="mr-2 h-4 w-4 text-primary" /> Text Position
                    </Label>
                    <IconPositionSelector selectedPosition={transcriptPosition} onPositionChange={onTranscriptPositionChange} />
                </div>
                {renderStyleControls(styleConfigForRender)}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resolution-select" className="text-base font-medium flex items-center">
                <MonitorSmartphone className="mr-2 h-5 w-5 text-primary" /> Resolution
              </Label>
              <Select value={resolution} onValueChange={(value) => onResolutionChange(value as VideoResolution)}>
                <SelectTrigger id="resolution-select">
                  <SelectValue placeholder="Resolution" />
                </SelectTrigger>
                <SelectContent>
                  {videoResolutions.map(res => (
                    <SelectItem key={res.value} value={res.value}>{res.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspect-ratio-select" className="text-base font-medium flex items-center">
                <Ratio className="mr-2 h-5 w-5 text-primary" /> Aspect Ratio
              </Label>
              <Select value={aspectRatio} onValueChange={(value) => onAspectRatioChange(value as VideoAspectRatio)}>
                <SelectTrigger id="aspect-ratio-select">
                  <SelectValue placeholder="Aspect Ratio" />
                </SelectTrigger>
                <SelectContent>
                  {videoAspectRatios.map(ratioItem => (
                    <SelectItem key={ratioItem.value} value={ratioItem.value}>{ratioItem.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
    

    
