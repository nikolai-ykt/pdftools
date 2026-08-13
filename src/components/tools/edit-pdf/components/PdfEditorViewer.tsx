import React, { RefObject } from 'react';

export interface PdfEditorViewerProps {
  pdfUrl: string;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  isEditorReady: boolean;
  isTextReplacing: boolean;
  onIframeLoad: () => void;
  loadingText?: string;
  updatingText?: string;
}

export function PdfEditorViewer({
  pdfUrl,
  iframeRef,
  isEditorReady,
  isTextReplacing,
  onIframeLoad,
  loadingText = 'Loading...',
  updatingText = 'Updating PDF text…',
}: PdfEditorViewerProps) {
  return (
    <div className="relative border border-[hsl(var(--color-border))] rounded-[var(--radius-md)] overflow-hidden bg-gray-100">
      <iframe
        ref={iframeRef}
        src={`/pdfjs-annotation-viewer/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`}
        className="w-full h-[700px] border-0"
        title="PDF Editor"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        onLoad={onIframeLoad}
      />
      {!isEditorReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--color-primary))] mx-auto mb-2" />
            <p className="text-sm text-[hsl(var(--color-muted-foreground))]">{loadingText}</p>
          </div>
        </div>
      )}
      {isTextReplacing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
          <div className="rounded-lg bg-white px-5 py-4 text-center shadow-lg">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-[hsl(var(--color-primary))]" />
            <p className="text-sm font-medium">{updatingText}</p>
          </div>
        </div>
      )}
    </div>
  );
}
