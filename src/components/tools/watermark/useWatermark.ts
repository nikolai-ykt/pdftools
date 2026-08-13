import { useState, useCallback, useRef } from 'react';
import type { ProcessingStatus } from '../ProcessingProgress';
import { addWatermark } from '@/lib/pdf/processors/watermark';
import { loadPdfLib } from '@/lib/pdf/loader';
import type { ProcessOutput } from '@/types/pdf';
import type { WatermarkSettings, PageSelectionSettings } from './types';
import { buildWatermarkOptions, getSelectedPages, validateWatermarkInput } from './utils';

const INITIAL_SETTINGS: WatermarkSettings = {
  type: 'text',
  text: 'CONFIDENTIAL',
  fontSize: 72,
  textColor: '#888888',
  textOpacity: 0.3,
  textAngle: -45,
  imageFile: null,
  imageOpacity: 0.3,
  imageAngle: 0,
  repeat: false,
  stagger: true,
  spacingX: 200,
  spacingY: 150,
};

const INITIAL_PAGE_SETTINGS: PageSelectionSettings = {
  mode: 'all',
  customRange: '',
};

export function useWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const [settings, setSettings] = useState<WatermarkSettings>(INITIAL_SETTINGS);
  const [pageSettings, setPageSettings] = useState<PageSelectionSettings>(INITIAL_PAGE_SETTINGS);

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateSettings = useCallback(<K extends keyof WatermarkSettings>(key: K, value: WatermarkSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updatePageSettings = useCallback(
    <K extends keyof PageSelectionSettings>(key: K, value: PageSelectionSettings[K]) => {
      setPageSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const selectFile = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    setResult(null);
    setStatus('idle');

    try {
      const pdfLib = await loadPdfLib();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setTotalPages(pdf.getPageCount());
    } catch (err) {
      console.error('Failed to load PDF to get page count:', err);
    }
  }, []);

  const clearFile = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setFile(null);
    setResult(null);
    setError(null);
    setStatus('idle');
    setTotalPages(0);
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setProgress(0);
    setProgressMessage('');
  }, []);

  const process = useCallback(
    async (tTools: (key: string) => string) => {
      const validationErrorKey = validateWatermarkInput({ file, settings, pageSettings });
      if (validationErrorKey) {
        setError(tTools(validationErrorKey));
        return;
      }

      if (!file) return;

      // Abort previous running operation if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setStatus('processing');
      setProgress(0);
      setError(null);
      setResult(null);

      try {
        const pages = getSelectedPages(pageSettings.mode, pageSettings.customRange, totalPages);
        const options = await buildWatermarkOptions(settings, pages);

        if (controller.signal.aborted) {
          return;
        }

        const output: ProcessOutput = await addWatermark(file, options, (prog, message) => {
          if (!controller.signal.aborted) {
            setProgress(prog);
            setProgressMessage(message || '');
          }
        });

        if (controller.signal.aborted) {
          return;
        }

        if (output.success && output.result) {
          setResult(output.result as Blob);
          setStatus('complete');
        } else {
          setError(output.error?.message || tTools('failed'));
          setStatus('error');
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : tTools('failed'));
          setStatus('error');
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [file, settings, pageSettings, totalPages]
  );

  return {
    file,
    status,
    progress,
    progressMessage,
    result,
    error,
    totalPages,
    settings,
    pageSettings,
    setError,
    selectFile,
    clearFile,
    updateSettings,
    updatePageSettings,
    process,
    cancel,
  };
}
