'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FileUploader } from '../FileUploader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  replaceExistingText,
  type ReplaceExistingTextDiagnostics,
  type TextFitMode,
} from '@/lib/pdf/processors/replace-existing-text';

import { usePdfFile } from './hooks/usePdfFile';
import { usePdfTextHistory } from './hooks/usePdfTextHistory';
import { patchIframeContent, type PatchScriptLabels } from './pdf-editor/patchPdfViewer';
import { TextHistoryControls } from './components/TextHistoryControls';
import { ReplacementDiagnosticsAlerts } from './components/ReplacementDiagnosticsModal';
import { PdfEditorViewer } from './components/PdfEditorViewer';

export interface EditPDFToolProps {
  className?: string;
}

/**
 * EditPDFTool Component
 * 
 * Modularized PDF Editor component supporting PDF.js annotation viewer,
 * custom shape & text annotations, Konva snapping alignment, and PDF text replacement.
 */
export function EditPDFTool({ className = '' }: EditPDFToolProps) {
  const t = useTranslations('common');
  const tTools = useTranslations('tools.editPdf');

  const {
    file,
    pdfUrl,
    error,
    setError,
    handleFilesSelected,
    handleUploadError,
    handleClear: clearFile,
    showFileVersion,
  } = usePdfFile();

  const {
    textUndoCount,
    textRedoCount,
    pushHistory,
    popUndo,
    popRedo,
    clearHistory,
  } = usePdfTextHistory();

  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isTextReplacing, setIsTextReplacing] = useState(false);
  const [replacementNotice, setReplacementNotice] = useState<string | null>(null);
  const [replacementDiagnostics, setReplacementDiagnostics] =
    useState<ReplaceExistingTextDiagnostics | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const patchLabels: PatchScriptLabels = useMemo(
    () => ({
      toolbar: {
        strokeColorLabel: tTools('strokeColorLabel'),
        fillColorLabel: tTools('fillColorLabel'),
      },
      history: {
        undoLabel: tTools('undo'),
        redoLabel: tTools('redo'),
        unnamedUser: tTools('unnamedUser'),
      },
      editor: {
        tool: tTools('existingTextEditor.tool') || 'Edit text',
        heading: tTools('existingTextEditor.heading') || 'Edit existing text',
        original: tTools('existingTextEditor.original') || 'Original text',
        replacement: tTools('existingTextEditor.replacement') || 'New text',
        apply: tTools('existingTextEditor.apply') || 'Apply',
        confirm: tTools('existingTextEditor.confirm') || 'Confirm change',
        cancel: tTools('existingTextEditor.cancel') || 'Cancel',
        hint: tTools('existingTextEditor.hint') || 'Click a text block in the PDF',
        overflow:
          tTools('existingTextEditor.overflow') ||
          'The new text does not fit in the original area.',
        fit: tTools('existingTextEditor.fit') || 'If it does not fit',
        preserve: tTools('existingTextEditor.preserve') || 'Keep original size',
        shrink: tTools('existingTextEditor.shrink') || 'Shrink to fit',
        expand: tTools('existingTextEditor.expand') || 'Expand the area',
        signature:
          tTools('existingTextEditor.signature') ||
          'Editing content invalidates existing digital signatures.',
      },
    }),
    [tTools]
  );

  const handleClear = useCallback(() => {
    clearFile();
    clearHistory();
    setIsEditorReady(false);
    setReplacementNotice(null);
    setReplacementDiagnostics(null);
  }, [clearFile, clearHistory]);

  const handleIframeLoad = useCallback(() => {
    setIsEditorReady(true);
    if (iframeRef.current) {
      patchIframeContent(iframeRef.current, patchLabels);
    }
  }, [patchLabels]);

  const handleExistingTextReplaced = useCallback(
    (
      result: Blob,
      count: number,
      diagnostics?: ReplaceExistingTextDiagnostics
    ) => {
      if (!file) return;
      const editedFile = new File([result], file.name, { type: 'application/pdf' });
      pushHistory(file);
      setReplacementNotice(`${count} text occurrence${count === 1 ? '' : 's'} replaced.`);
      setReplacementDiagnostics(diagnostics ?? null);
      setIsEditorReady(false);
      showFileVersion(editedFile);
    },
    [file, pushHistory, showFileVersion]
  );

  const handleTextUndo = useCallback(() => {
    if (!file || isTextReplacing) return;
    const previousFile = popUndo(file);
    if (!previousFile) return;
    setReplacementNotice(tTools('textUndoApplied'));
    setReplacementDiagnostics(null);
    setIsEditorReady(false);
    showFileVersion(previousFile);
  }, [file, isTextReplacing, popUndo, showFileVersion, tTools]);

  const handleTextRedo = useCallback(() => {
    if (!file || isTextReplacing) return;
    const nextFile = popRedo(file);
    if (!nextFile) return;
    setReplacementNotice(tTools('textRedoApplied'));
    setReplacementDiagnostics(null);
    setIsEditorReady(false);
    showFileVersion(nextFile);
  }, [file, isTextReplacing, popRedo, showFileVersion, tTools]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.type !== 'pdfcraft:replace-existing-text' ||
        !file ||
        isTextReplacing
      ) {
        return;
      }

      const payload = event.data.payload as {
        page: number;
        text: string;
        replacementText: string;
        x: number;
        y: number;
        width: number;
        height: number;
        fitMode?: TextFitMode;
      };

      if (
        !payload ||
        !Number.isFinite(payload.page) ||
        !Number.isFinite(payload.x) ||
        !Number.isFinite(payload.y) ||
        !Number.isFinite(payload.width) ||
        !Number.isFinite(payload.height)
      ) {
        return;
      }

      setIsTextReplacing(true);
      setError(null);
      const match = {
        page: payload.page,
        text: payload.text,
        x: payload.x,
        y: payload.y,
        width: payload.width,
        height: payload.height,
        id: `inline-${payload.page}-${payload.x}-${payload.y}`,
        selected: true,
      };

      const result = await replaceExistingText(
        file,
        [match],
        {
          replacementText: payload.replacementText,
          fitMode: payload.fitMode ?? 'preserve',
        }
      );

      if (result.success && result.result) {
        handleExistingTextReplaced(
          result.result,
          result.replacedCount,
          result.diagnostics
        );
      } else {
        setError(result.error || 'Unable to edit the selected text.');
      }
      setIsTextReplacing(false);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [file, handleExistingTextReplaced, isTextReplacing, setError]);

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {!file && (
        <FileUploader
          accept={['application/pdf', '.pdf']}
          multiple={false}
          maxFiles={1}
          onFilesSelected={handleFilesSelected}
          onError={handleUploadError}
          label={tTools('uploadLabel')}
          description={tTools('uploadDescription')}
        />
      )}

      {error && (
        <div className="p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700" role="alert">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {file && pdfUrl && (
        <div className="space-y-4">
          <Card variant="outlined" size="sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                  <path d="M14 2v6h6" fill="white" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--color-foreground))]">{file.name}</p>
                  <p className="text-xs text-[hsl(var(--color-muted-foreground))]">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                {t('buttons.clear') || 'Clear'}
              </Button>
            </div>
          </Card>

          <ReplacementDiagnosticsAlerts
            replacementNotice={replacementNotice}
            overflowDetected={replacementDiagnostics?.overflowDetected}
            usedFallbackFont={replacementDiagnostics?.usedFallbackFont}
            hasDigitalSignatures={replacementDiagnostics?.hasDigitalSignatures}
            tTools={tTools}
          />

          <TextHistoryControls
            label={tTools('textHistory')}
            undoLabel={tTools('textUndo')}
            redoLabel={tTools('textRedo')}
            undoCount={textUndoCount}
            redoCount={textRedoCount}
            isReplacing={isTextReplacing}
            onUndo={handleTextUndo}
            onRedo={handleTextRedo}
          />

          <PdfEditorViewer
            pdfUrl={pdfUrl}
            iframeRef={iframeRef}
            isEditorReady={isEditorReady}
            isTextReplacing={isTextReplacing}
            onIframeLoad={handleIframeLoad}
            loadingText={t('status.loading') || 'Loading...'}
          />
        </div>
      )}
    </div>
  );
}

export default EditPDFTool;
