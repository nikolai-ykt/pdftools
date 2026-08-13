import React from 'react';
import { Card } from '@/components/ui/Card';
import { VisualField, FieldType } from '../types';
import { FieldOverlay } from './FieldOverlay';

interface PdfCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  currentPageFields: VisualField[];
  pageSize: { width: number; height: number };
  scale: number;
  selectedFieldId: string | null;
  currentTool: FieldType | 'select';
  currentPage: number;
  onAddFieldAt: (type: FieldType, x: number, pdfY: number, pageNum: number) => void;
  onFieldClick: (e: React.MouseEvent, fieldId: string) => void;
  onFieldMouseDown: (e: React.MouseEvent, fieldId: string, isResize?: boolean) => void;
  tTools: (key: string) => string;
}

export function PdfCanvas({
  containerRef,
  canvasRef,
  currentPageFields,
  pageSize,
  scale,
  selectedFieldId,
  currentTool,
  currentPage,
  onAddFieldAt,
  onFieldClick,
  onFieldMouseDown,
  tTools,
}: PdfCanvasProps) {
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentTool === 'select' || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const pdfY = pageSize.height / scale - y;

    onAddFieldAt(currentTool, x, pdfY, currentPage);
  };

  return (
    <Card variant="outlined" size="sm">
      <div
        ref={containerRef}
        className="relative bg-gray-100 rounded-[var(--radius-md)] overflow-auto"
        style={{ maxHeight: '600px' }}
      >
        <div
          className="relative inline-block"
          onClick={handleCanvasClick}
          style={{ cursor: currentTool !== 'select' ? 'crosshair' : 'default' }}
        >
          <canvas ref={canvasRef} className="shadow-lg bg-white" />

          {/* Field overlays */}
          {currentPageFields.map((field) => (
            <FieldOverlay
              key={field.id}
              field={field}
              pageSize={pageSize}
              scale={scale}
              selectedFieldId={selectedFieldId}
              currentTool={currentTool}
              onFieldClick={onFieldClick}
              onFieldMouseDown={onFieldMouseDown}
            />
          ))}
        </div>
      </div>

      {/* Simple hint */}
      <p className="text-xs text-gray-400 text-center mt-2">
        {currentTool === 'select'
          ? tTools('formCreator.selectHint')
          : tTools('formCreator.clickToAdd') || 'Click on PDF to add field'}
      </p>
    </Card>
  );
}
