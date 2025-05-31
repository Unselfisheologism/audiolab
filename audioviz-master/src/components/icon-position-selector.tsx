
"use client";

import type React from 'react';
import { Button } from '@/components/ui/button';
import type { IconPosition } from '@/types';
import { iconPositionOptions } from '@/types'; // Using the more descriptive name
import { cn } from '@/lib/utils';

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
          size="icon" // Makes buttons square and small
          className={cn(
            "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center", // Fixed size
            selectedPosition === pos.value ? "bg-primary text-primary-foreground" : "bg-background"
          )}
          onClick={() => onPositionChange(pos.value)}
          aria-label={pos.label}
        >
          {/* You can add a visual cue like a dot or small square here if desired,
              for now, the button's position in grid and selection state indicates its function */}
        </Button>
      ))}
    </div>
  );
}
