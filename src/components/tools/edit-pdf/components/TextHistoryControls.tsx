import React from 'react';
import { Button } from '@/components/ui/Button';

export interface TextHistoryControlsProps {
  label: string;
  undoLabel: string;
  redoLabel: string;
  undoCount: number;
  redoCount: number;
  isReplacing: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function TextHistoryControls({
  label,
  undoLabel,
  redoLabel,
  undoCount,
  redoCount,
  isReplacing,
  onUndo,
  onRedo,
}: TextHistoryControlsProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-md border border-[hsl(var(--color-border))] bg-white p-2"
      aria-label={label}
    >
      <span className="mr-1 text-xs font-medium text-[hsl(var(--color-muted-foreground))]">
        {label}:
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        disabled={undoCount === 0 || isReplacing}
      >
        ↩ {undoLabel}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRedo}
        disabled={redoCount === 0 || isReplacing}
      >
        ↪ {redoLabel}
      </Button>
    </div>
  );
}
