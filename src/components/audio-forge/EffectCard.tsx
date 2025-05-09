import type React from 'react';
import type { Effect, EffectParameter, EffectSettings } from '@/types/audio-forge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fallbackIcon } from '@/app/audio-forge/effects';
import { Loader2 } from 'lucide-react';

interface EffectCardProps {
  effect: Effect;
  onApplyEffect: (effectId: string, params: EffectSettings) => void;
  onParameterChange: (effectId: string, paramName: string, value: any) => void;
  currentSettings: EffectSettings;
  isLoading: boolean;
  isAudioLoaded: boolean;
}

export function EffectCard({ effect, onApplyEffect, onParameterChange, currentSettings, isLoading, isAudioLoaded }: EffectCardProps) {
  const IconComponent = effect.icon || fallbackIcon;

  const handleSliderChange = (paramName: string, value: number[]) => {
    onParameterChange(effect.id, paramName, value[0]);
  };

  const handleInputChange = (paramName: string, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = effect.parameters?.find(p => p.name === paramName)?.type === 'number_input'
      ? parseFloat(event.target.value)
      : event.target.value;
    onParameterChange(effect.id, paramName, value);
  };
  
  const handleSelectChange = (paramName: string, value: string) => {
    onParameterChange(effect.id, paramName, value);
  };

  const handleToggleChange = (paramName: string, checked: boolean) => {
    onParameterChange(effect.id, paramName, checked);
  };

  const renderParameterControl = (param: EffectParameter) => {
    const value = currentSettings[param.name] ?? param.defaultValue;
    switch (param.type) {
      case 'slider':
        return (
          <div key={param.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={`${effect.id}-${param.name}`}>{param.label}</Label>
              <span className="text-sm text-muted-foreground">{value}</span>
            </div>
            <Slider
              id={`${effect.id}-${param.name}`}
              value={[Number(value)]}
              min={param.min}
              max={param.max}
              step={param.step}
              onValueChange={(val) => handleSliderChange(param.name, val)}
              disabled={isLoading || !isAudioLoaded}
            />
          </div>
        );
      case 'number_input':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={`${effect.id}-${param.name}`}>{param.label}</Label>
            <Input
              id={`${effect.id}-${param.name}`}
              type="number"
              value={value as string | number}
              min={param.min}
              max={param.max}
              step={param.step}
              onChange={(e) => handleInputChange(param.name, e)}
              disabled={isLoading || !isAudioLoaded}
              className="w-full"
            />
          </div>
        );
      case 'select':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={`${effect.id}-${param.name}`}>{param.label}</Label>
            <Select
              value={value as string}
              onValueChange={(val) => handleSelectChange(param.name, val)}
              disabled={isLoading || !isAudioLoaded}
            >
              <SelectTrigger id={`${effect.id}-${param.name}`}>
                <SelectValue placeholder={`Select ${param.label}`} />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map(opt => (
                  <SelectItem key={String(opt.value)} value={String(opt.value)}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'textarea':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={`${effect.id}-${param.name}`}>{param.label}</Label>
            <Textarea
              id={`${effect.id}-${param.name}`}
              value={value as string}
              placeholder={param.placeholder}
              rows={param.rows || 3}
              onChange={(e) => handleInputChange(param.name, e)}
              disabled={isLoading || !isAudioLoaded}
            />
          </div>
        );
      // For 'button' type under parameters (used for preset groups)
      case 'button': // This case is specific for grouped buttons within a card
        return (
            <Button
              key={param.name}
              variant="outline"
              size="sm"
              onClick={() => onApplyEffect(param.handlerKey || effect.id, { preset: param.name })}
              disabled={isLoading || !isAudioLoaded}
              className="w-full"
            >
              {param.label}
            </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-md overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IconComponent className="h-5 w-5 text-primary" />
          {effect.name}
        </CardTitle>
        <CardDescription className="text-xs">{effect.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {effect.parameters?.map(renderParameterControl)}
      </CardContent>
      {(effect.controlType === 'button' && effect.actionLabel && !effect.parameters?.some(p => p.type === 'button')) && (
        <CardFooter>
          <Button
            onClick={() => onApplyEffect(effect.id, currentSettings)}
            disabled={isLoading || !isAudioLoaded}
            className="w-full"
          >
            {isLoading && effect.outputsAnalysis ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {effect.actionLabel}
          </Button>
        </CardFooter>
      )}
      {effect.controlType === 'toggle' && effect.parameters && (
        <CardFooter className="flex items-center justify-between">
          <Label htmlFor={`${effect.id}-${effect.parameters[0].name}`}>{effect.parameters[0].label}</Label>
          <Switch
            id={`${effect.id}-${effect.parameters[0].name}`}
            checked={currentSettings[effect.parameters[0].name] ?? effect.parameters[0].defaultValue}
            onCheckedChange={(checked) => handleToggleChange(effect.parameters![0].name, checked)} // Non-null assertion as toggle implies param
            disabled={isLoading || !isAudioLoaded}
          />
        </CardFooter>
      )}
    </Card>
  );
}
