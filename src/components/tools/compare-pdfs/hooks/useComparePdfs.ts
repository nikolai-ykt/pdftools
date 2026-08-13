import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { ProcessingStatus } from '../../ProcessingProgress';
import type { PDFFile, PageComparisonResult, FilterPills, DiffHighlight } from '../types';
import { usePdfLoader } from './usePdfLoader';
import {
  smartPagePairing,
  diffSinglePageWords,
  findMovedTextSegments
} from '../utils/diffAlgorithm';

export function useComparePdfs() {
  const t = useTranslations('common');

  const [file1, setFile1] = useState<PDFFile | null>(null);
  const [file2, setFile2] = useState<PDFFile | null>(null);

  const [filterPills, setFilterPills] = useState<FilterPills>({
    text: true,
    formatting: true,
    headerFooter: false,
    moved: true
  });

  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [pairedPages, setPairedPages] = useState<PageComparisonResult[]>([]);
  const [currentPairIdx, setCurrentPairIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scrollContainer1Ref = useRef<HTMLDivElement>(null);
  const scrollContainer2Ref = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef(false);
  const comparisonContainerRef = useRef<HTMLDivElement>(null);

  const { loadPDF, cancelLoading, resetCancelled } = usePdfLoader();

  const isProcessing = status === 'processing';

  const handleCancel = useCallback(() => {
    cancelLoading();
    setStatus('idle');
    setProgress(0);
  }, [cancelLoading]);

  const handleFile1Selected = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      resetCancelled();
      setStatus('processing');
      setProgress(0);
      setProgressMessage(t('comparePdfs.progressExtractingOriginal'));
      setError(null);
      setPairedPages([]);

      try {
        const loaded = await loadPDF(files[0], 1, setProgress);
        if (loaded) setFile1(loaded);
        setStatus('idle');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('comparePdfs.errorExtractingOriginal'));
        setStatus('error');
      }
    },
    [loadPDF, resetCancelled, t]
  );

  const handleFile2Selected = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      resetCancelled();
      setStatus('processing');
      setProgress(50);
      setProgressMessage(t('comparePdfs.progressExtractingModified'));
      setError(null);
      setPairedPages([]);

      try {
        const loaded = await loadPDF(files[0], 2, setProgress);
        if (loaded) setFile2(loaded);
        setStatus('idle');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('comparePdfs.errorExtractingModified'));
        setStatus('error');
      }
    },
    [loadPDF, resetCancelled, t]
  );

  const handleCompare = useCallback(() => {
    if (!file1 || !file2) return;

    resetCancelled();
    setStatus('processing');
    setProgress(95);
    setProgressMessage(t('comparePdfs.progressRunningDiff'));

    try {
      const pairedList = smartPagePairing(file1, file2);

      pairedList.forEach(pair => {
        if (pair.pageIndex1 !== -1 && pair.pageIndex2 !== -1) {
          const page1 = file1.pageTextContents[pair.pageIndex1];
          const page2 = file2.pageTextContents[pair.pageIndex2];

          const dim1 = file1.pageDimensions[pair.pageIndex1];
          const dim2 = file2.pageDimensions[pair.pageIndex2];

          const diffResult = diffSinglePageWords(
            page1.words,
            page2.words,
            dim1.height,
            dim2.height
          );

          pair.highlights1 = diffResult.highlights1;
          pair.highlights2 = diffResult.highlights2;
          pair.hasDifference = diffResult.hasDifference;
          pair.diffPercentage = diffResult.diffPercentage;
        } else {
          pair.hasDifference = true;
          pair.diffPercentage = 100;
          pair.highlights1 = [];
          pair.highlights2 = [];
        }
      });

      findMovedTextSegments(pairedList);

      setPairedPages(pairedList);
      setCurrentPairIdx(0);
      setStatus('complete');
    } catch (err) {
      console.error(err);
      setError(t('comparePdfs.errorDiffFailed'));
      setStatus('error');
    }
  }, [file1, file2, resetCancelled, t]);

  const handleClearAll = useCallback(() => {
    setFile1(null);
    setFile2(null);
    setPairedPages([]);
    setError(null);
    setStatus('idle');
    setProgress(0);
    setCurrentPairIdx(0);
  }, []);

  const handleScroll1 = useCallback(() => {
    if (isScrollingSyncRef.current) return;
    if (!scrollContainer1Ref.current || !scrollContainer2Ref.current) return;
    isScrollingSyncRef.current = true;
    scrollContainer2Ref.current.scrollTop = scrollContainer1Ref.current.scrollTop;
    scrollContainer2Ref.current.scrollLeft = scrollContainer1Ref.current.scrollLeft;
    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false;
    });
  }, []);

  const handleScroll2 = useCallback(() => {
    if (isScrollingSyncRef.current) return;
    if (!scrollContainer1Ref.current || !scrollContainer2Ref.current) return;
    isScrollingSyncRef.current = true;
    scrollContainer1Ref.current.scrollTop = scrollContainer2Ref.current.scrollTop;
    scrollContainer1Ref.current.scrollLeft = scrollContainer2Ref.current.scrollLeft;
    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false;
    });
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!comparisonContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await comparisonContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const getFilteredHighlights = useCallback(
    (highlights: DiffHighlight[]) => {
      return highlights.filter(hl => {
        if (hl.type === 'moved' && !filterPills.moved) return false;
        if (hl.category === 'header-footer' && !filterPills.headerFooter) return false;
        if (hl.category === 'formatting' && !filterPills.formatting) return false;
        if (hl.category === 'text' && !filterPills.text) return false;
        return true;
      });
    },
    [filterPills]
  );

  return {
    file1,
    setFile1,
    file2,
    setFile2,
    filterPills,
    setFilterPills,
    status,
    progress,
    progressMessage,
    error,
    setError,
    isProcessing,
    pairedPages,
    currentPairIdx,
    setCurrentPairIdx,
    isFullscreen,
    scrollContainer1Ref,
    scrollContainer2Ref,
    comparisonContainerRef,
    handleFile1Selected,
    handleFile2Selected,
    handleCompare,
    handleClearAll,
    handleCancel,
    handleScroll1,
    handleScroll2,
    toggleFullscreen,
    getFilteredHighlights
  };
}
