'use client';

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProcessingStatus } from '@/components/tools/ProcessingProgress';
import { normalizeInputAngle } from './types';

export interface RotateSteplessPanelProps {
  steplessAngle: string;
  setSteplessAngle: React.Dispatch<React.SetStateAction<string>>;
  selectedPages: Set<number>;
  isProcessing: boolean;
  status: ProcessingStatus;
  onApplyAbsoluteRotation: (angle: number) => void;
}

export function RotateSteplessPanel({
  steplessAngle,
  setSteplessAngle,
  selectedPages,
  isProcessing,
  status,
  onApplyAbsoluteRotation,
}: RotateSteplessPanelProps) {
  const t = useTranslations('tools');
  const dialContainerRef = useRef<HTMLDivElement>(null);
  const [isDialDragging, setIsDialDragging] = useState(false);

  const calculateDialAngle = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dialContainerRef.current) return;
    const rect = dialContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    let angleRad = Math.atan2(dy, dx);
    let angleDeg = (angleRad * 180) / Math.PI;

    angleDeg = angleDeg + 90;

    let normalized = angleDeg % 360;
    if (normalized > 180) normalized -= 360;
    if (normalized <= -180) normalized += 360;

    normalized = Math.round(normalized * 2) / 2;

    setSteplessAngle(normalized.toString());
    onApplyAbsoluteRotation(normalized);
  };

  const handleDialPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (status === 'processing') return;
    setIsDialDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    calculateDialAngle(e);
  };

  const handleDialPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDialDragging || status === 'processing') return;
    calculateDialAngle(e);
  };

  const handleDialPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDialDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleDialWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (status === 'processing') return;

    const step = e.shiftKey ? 5 : 0.5;
    const direction = e.deltaY < 0 ? 1 : -1;

    setSteplessAngle(prev => {
      const current = parseFloat(prev) || 0;
      let next = current + direction * step;
      if (next > 180) next -= 360;
      if (next <= -180) next += 360;
      const rounded = Math.round(next * 10) / 10;
      onApplyAbsoluteRotation(rounded);
      return rounded.toString();
    });
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || val === '-' || val.endsWith('.') || val.endsWith('.0')) {
      setSteplessAngle(val);
      return;
    }

    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setSteplessAngle(val);
      onApplyAbsoluteRotation(normalizeInputAngle(parsed));
    }
  };

  const handleTextInputBlur = () => {
    const finalAngle = normalizeInputAngle(steplessAngle);
    setSteplessAngle(finalAngle.toString());
    onApplyAbsoluteRotation(finalAngle);
  };

  const handleTextInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const finalAngle = normalizeInputAngle(steplessAngle);
      setSteplessAngle(finalAngle.toString());
      onApplyAbsoluteRotation(finalAngle);
      e.currentTarget.blur();
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value) || 0;
    setSteplessAngle(parsed.toString());
    onApplyAbsoluteRotation(parsed);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Visual Rotating Circle Dial Container */}
      <div className="flex flex-col items-center justify-center">
        <div
          ref={dialContainerRef}
          onPointerDown={handleDialPointerDown}
          onPointerMove={handleDialPointerMove}
          onPointerUp={handleDialPointerUp}
          onPointerCancel={handleDialPointerUp}
          onWheel={handleDialWheel}
          className="relative w-36 h-36 rounded-full border-2 border-[hsl(var(--color-primary)/0.25)] dark:border-zinc-700/60 bg-[hsl(var(--color-card))] shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Angular Scale marks background */}
          <svg className="absolute w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x1 = 50 + 40 * Math.cos(angle);
              const y1 = 50 + 40 * Math.sin(angle);
              const x2 = 50 + (i % 3 === 0 ? 33 : 36) * Math.cos(angle);
              const y2 = 50 + (i % 3 === 0 ? 33 : 36) * Math.sin(angle);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={i % 3 === 0 ? 'hsl(var(--color-primary)/0.5)' : 'hsl(var(--color-muted-foreground)/0.3)'}
                  strokeWidth={i % 3 === 0 ? 1 : 0.6}
                />
              );
            })}
          </svg>

          {/* Interactive dial pointer dial handle */}
          <div
            className="absolute w-full h-full pointer-events-none transition-transform"
            style={{ transform: `rotate(${parseFloat(steplessAngle) || 0}deg)` }}
          >
            {/* Radial indicator line */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-[hsl(var(--color-primary))] rounded-full" />
            {/* Dial Knob Handle */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[hsl(var(--color-primary))] border-2 border-white dark:border-black shadow-md" />
          </div>

          {/* Inner readout display */}
          <div className="text-center z-10 pointer-events-none">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[hsl(var(--color-muted-foreground))]">
              {t('rotate.correctionLabel')}
            </p>
            <p className="text-2xl font-black text-[hsl(var(--color-foreground))] tracking-tighter">
              {parseFloat(steplessAngle) > 0 ? `+${steplessAngle}` : steplessAngle}°
            </p>
            <p className="text-[9px] text-[hsl(var(--color-primary))] font-semibold">
              {t('rotate.wheelHelp')}
            </p>
          </div>
        </div>
      </div>

      {/* Stepless Smooth Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-[hsl(var(--color-muted-foreground))]">
          <span>{t('rotate.sliderLeft')}</span>
          <span className="text-[hsl(var(--color-primary))] font-bold">{t('rotate.sliderTitle')}</span>
          <span>{t('rotate.sliderRight')}</span>
        </div>
        <input
          type="range"
          min="-180"
          max="180"
          step="0.5"
          value={parseFloat(steplessAngle) || 0}
          onChange={handleSliderChange}
          disabled={isProcessing || selectedPages.size === 0}
          className="w-full h-1.5 rounded-lg appearance-none bg-[hsl(var(--color-muted))] accent-[hsl(var(--color-primary))] outline-none cursor-pointer"
        />
      </div>

      {/* Numeric Precision Input Block with quick -0.5 and +0.5 */}
      <div className="pt-2 border-t border-[hsl(var(--color-border))] flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-[hsl(var(--color-muted-foreground))]">
          {t('rotate.preciseInput')}
        </span>

        <div className="flex items-center bg-[hsl(var(--color-muted)/0.4)] border border-[hsl(var(--color-input))] rounded-[var(--radius-md)] overflow-hidden pr-2">
          <button
            type="button"
            onClick={() => {
              const val = Math.max(-180, (parseFloat(steplessAngle) || 0) - 0.5);
              setSteplessAngle(val.toString());
              onApplyAbsoluteRotation(val);
            }}
            disabled={isProcessing || selectedPages.size === 0}
            className="w-8 h-8 font-bold text-sm flex items-center justify-center hover:bg-[hsl(var(--color-muted))] text-[hsl(var(--color-foreground))] transition-colors"
          >
            -
          </button>

          <div className="relative flex items-center max-w-[70px]">
            <input
              type="text"
              value={steplessAngle}
              onChange={handleTextInputChange}
              onBlur={handleTextInputBlur}
              onKeyDown={handleTextInputKeyDown}
              disabled={isProcessing || selectedPages.size === 0}
              className="w-full text-center bg-transparent font-bold text-sm text-[hsl(var(--color-foreground))] border-none outline-none py-1 focus:ring-0"
            />
            <span className="absolute right-0.5 text-xs text-[hsl(var(--color-muted-foreground))] select-none">°</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const val = Math.min(180, (parseFloat(steplessAngle) || 0) + 0.5);
              setSteplessAngle(val.toString());
              onApplyAbsoluteRotation(val);
            }}
            disabled={isProcessing || selectedPages.size === 0}
            className="w-8 h-8 font-bold text-sm flex items-center justify-center hover:bg-[hsl(var(--color-muted))] text-[hsl(var(--color-foreground))] transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Range Alert Message */}
      <div className="text-[10px] text-[hsl(var(--color-muted-foreground))] bg-[hsl(var(--color-muted)/0.25)] p-2.5 rounded-[var(--radius-md)] border border-[hsl(var(--color-border))] leading-relaxed">
        {t.rich('rotate.inputTip', { b: (chunks) => <strong>{chunks}</strong>, code: (chunks) => <code>{chunks}</code> })}
      </div>
    </div>
  );
}
