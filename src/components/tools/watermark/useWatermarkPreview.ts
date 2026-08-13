import { useState, useEffect, useRef, useCallback } from 'react';
import { extractPages, parsePageSelection } from '@/lib/pdf/processors/extract';
import { addWatermark } from '@/lib/pdf/processors/watermark';
import type { WatermarkSettings, PageSelectionSettings } from './types';
import { buildWatermarkOptions } from './utils';

interface UseWatermarkPreviewProps {
  file: File | null;
  settings: WatermarkSettings;
  pageSettings: PageSelectionSettings;
  totalPages: number;
}

export function useWatermarkPreview({ file, settings, pageSettings, totalPages }: UseWatermarkPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Request counter to cancel stale preview responses (race condition prevention)
  const previewRequestRef = useRef(0);
  const previewUrlRef = useRef<string | null>(null);

  // Keep previewUrlRef in sync
  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  const revokeCurrentPreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewUrl(null);
    }
  }, []);

  const generatePreview = useCallback(async () => {
    if (!file) {
      revokeCurrentPreviewUrl();
      return;
    }

    if (settings.type === 'text' && !settings.text.trim()) return;
    if (settings.type === 'image' && !settings.imageFile) return;

    const requestId = ++previewRequestRef.current;
    setIsPreviewing(true);

    try {
      // Determine which page to preview (first page of user's selection)
      let previewPage = 1;
      if (pageSettings.mode === 'odd') previewPage = 1;
      else if (pageSettings.mode === 'even') previewPage = totalPages >= 2 ? 2 : 1;
      else if (pageSettings.mode === 'custom') {
        const selectedPages = parsePageSelection(pageSettings.customRange, totalPages);
        if (selectedPages.length > 0) previewPage = selectedPages[0];
      }

      // Build options for preview (watermarking page 1 of extracted preview PDF)
      const options = await buildWatermarkOptions(settings, [1]);

      if (requestId !== previewRequestRef.current) return;

      // Extract single target page for fast preview processing
      const extractOutput = await extractPages(file, [previewPage]);
      if (requestId !== previewRequestRef.current || !extractOutput.success || !extractOutput.result) {
        return;
      }

      const previewSinglePageFile = new File([extractOutput.result as Blob], 'preview.pdf', {
        type: 'application/pdf',
      });

      const output = await addWatermark(previewSinglePageFile, options);
      if (requestId !== previewRequestRef.current) return;

      if (output.success && output.result) {
        const newUrl = URL.createObjectURL(output.result as Blob);

        // Safely revoke old URL and set new URL
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        previewUrlRef.current = newUrl;
        setPreviewUrl(newUrl);
      }
    } catch (err) {
      if (requestId === previewRequestRef.current) {
        console.error('Preview generation failed:', err);
      }
    } finally {
      if (requestId === previewRequestRef.current) {
        setIsPreviewing(false);
      }
    }
  }, [file, settings, pageSettings, totalPages, revokeCurrentPreviewUrl]);

  // Debounce preview updates by 600ms
  useEffect(() => {
    if (!file) {
      revokeCurrentPreviewUrl();
      return;
    }

    const timer = setTimeout(() => {
      generatePreview();
    }, 600);

    return () => clearTimeout(timer);
  }, [file, settings, pageSettings, totalPages, generatePreview, revokeCurrentPreviewUrl]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  return {
    previewUrl,
    isPreviewing,
  };
}
