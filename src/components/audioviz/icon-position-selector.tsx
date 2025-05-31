"use client";

import type React from 'react';
import { Button } from '@/components/ui/button';
import type { IconPosition } from '@/types/audiovizTypes';
import { iconPositionOptions } from '@/types/audiovizTypes';
import { cn } from '@/lib/utils'; // Assuming audiolab has this

interface IconPositionSelectorProps {
  selectedPosition: IconPosition;
  onPositionChange: (position: IconPosition) => void;
}

export default function IconPositionSelector({
  selectedPosition,
  onPositionChange,
}: IconPositionSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-1 p-1 border border-input rounded-md w-max">
      {iconPositionOptions.map((pos) => (
        <Button
          key={pos.value}
          variant={selectedPosition === pos.value ? 'default' : 'outline'}
          size="icon"
          className={cn(
            "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center",
            selectedPosition === pos.value ? "bg-primary text-primary-foreground" : "bg-background"
          )}
          onClick={() => onPositionChange(pos.value)}
          aria-label={pos.label}
        >
        </Button>
      ))}
    </div>
  );
}
