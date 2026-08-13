import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';
import type { PDFFile, PageComparisonResult, DiffHighlight } from '../types';

interface ComparePageViewerProps {
  file1: PDFFile | null;
  file2: PDFFile | null;
  currentPair: PageComparisonResult | undefined;
  isFullscreen: boolean;
  getFilteredHighlights: (highlights: DiffHighlight[]) => DiffHighlight[];
  scrollContainer1Ref: React.RefObject<HTMLDivElement | null>;
  scrollContainer2Ref: React.RefObject<HTMLDivElement | null>;
  comparisonContainerRef: React.RefObject<HTMLDivElement | null>;
  onScroll1: () => void;
  onScroll2: () => void;
}

export function ComparePageViewer({
  file1,
  file2,
  currentPair,
  isFullscreen,
  getFilteredHighlights,
  scrollContainer1Ref,
  scrollContainer2Ref,
  comparisonContainerRef,
  onScroll1,
  onScroll2
}: ComparePageViewerProps) {
  const t = useTranslations('common');

  return (
    <div
      ref={comparisonContainerRef}
      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
        isFullscreen ? 'fixed inset-0 z-50 p-4 bg-zinc-900 overflow-y-auto' : ''
      }`}
    >
      {/* LEFT Version (Original / Deleted Page) */}
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            {t('comparePdfs.originalVersion')}
          </span>
          <span className="text-[10px] font-bold text-zinc-500">
            {currentPair?.pageIndex1 !== -1 ? t('comparePdfs.pageNumber', { page: (currentPair?.pageIndex1 ?? 0) + 1 }) : '---'}
          </span>
        </div>

        <div
          ref={scrollContainer1Ref}
          onScroll={onScroll1}
          className="border border-[hsl(var(--color-border))] rounded-2xl bg-zinc-950 overflow-auto relative flex items-center justify-center p-4 min-h-[500px] max-h-[720px] shadow-inner custom-scrollbar"
        >
          {currentPair?.pageIndex1 !== -1 && file1 && currentPair?.pageIndex1 !== undefined ? (
            <div className="relative transform-gpu">
              {/* Rendered PDF base canvas image */}
              <img
                src={file1.pagesImages[currentPair.pageIndex1]}
                alt="Original Page"
                className="max-w-none shadow-md rounded-lg"
                style={{
                  width: `${file1.pageDimensions[currentPair.pageIndex1].width}px`,
                  height: `${file1.pageDimensions[currentPair.pageIndex1].height}px`
                }}
              />

              {/* Diff highlights Overlay Layer */}
              <div className="absolute inset-0 pointer-events-none">
                {getFilteredHighlights(currentPair.highlights1).map((hl, idx) => (
                  <div
                    key={idx}
                    className="absolute rounded-sm transition-all duration-300 pointer-events-auto cursor-help group"
                    style={{
                      left: `${hl.x}px`,
                      top: `${hl.y}px`,
                      width: `${hl.w}px`,
                      height: `${hl.h}px`,
                      background:
                        hl.type === 'deleted'
                          ? 'rgba(239, 68, 68, 0.18)'
                          : hl.type === 'modified'
                          ? 'rgba(245, 158, 11, 0.18)'
                          : 'rgba(168, 85, 247, 0.18)',
                      border:
                        hl.type === 'deleted'
                          ? '1px solid rgba(239, 68, 68, 0.4)'
                          : hl.type === 'modified'
                          ? '1px solid rgba(245, 158, 11, 0.4)'
                          : '1px dashed rgba(168, 85, 247, 0.6)',
                      boxShadow:
                        hl.type === 'deleted'
                          ? '0 0 4px rgba(239, 68, 68, 0.15)'
                          : hl.type === 'modified'
                          ? '0 0 4px rgba(245, 158, 11, 0.15)'
                          : '0 0 4px rgba(168, 85, 247, 0.15)'
                    }}
                  >
                    {/* Tooltip widget */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-950 text-white text-[9px] font-bold py-1 px-2.5 rounded-lg border border-zinc-800 shadow-xl z-30 whitespace-nowrap leading-none pointer-events-none">
                      {hl.type === 'deleted'
                        ? t('comparePdfs.removedText')
                        : hl.type === 'modified'
                        ? t('comparePdfs.modifiedText')
                        : t('comparePdfs.paragraphMovedRight')}
                      <span className="text-zinc-400 block mt-1">"{hl.text}"</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Inserted Page placeholder blank board (file 1 has no corresponding page) */
            <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 w-full min-h-[500px] border border-dashed border-zinc-800 rounded-xl bg-zinc-950/60 backdrop-blur-md">
              <AlertCircle className="w-10 h-10 text-emerald-500/70 mb-4 animate-bounce" />
              {t('comparePdfs.insertedPageTitle')}
              <p className="text-[10px] text-zinc-600 mt-1 max-w-xs">
                {t('comparePdfs.insertedPageDesc')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT Version (Modified / Inserted Page) */}
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
            {t('comparePdfs.modifiedVersion')}
          </span>
          <span className="text-[10px] font-bold text-zinc-500">
            {currentPair?.pageIndex2 !== -1 ? t('comparePdfs.pageNumber', { page: (currentPair?.pageIndex2 ?? 0) + 1 }) : '---'}
          </span>
        </div>

        <div
          ref={scrollContainer2Ref}
          onScroll={onScroll2}
          className="border border-[hsl(var(--color-border))] rounded-2xl bg-zinc-950 overflow-auto relative flex items-center justify-center p-4 min-h-[500px] max-h-[720px] shadow-inner custom-scrollbar"
        >
          {currentPair?.pageIndex2 !== -1 && file2 && currentPair?.pageIndex2 !== undefined ? (
            <div className="relative transform-gpu">
              {/* Rendered PDF base canvas image */}
              <img
                src={file2.pagesImages[currentPair.pageIndex2]}
                alt="Modified Page"
                className="max-w-none shadow-md rounded-lg"
                style={{
                  width: `${file2.pageDimensions[currentPair.pageIndex2].width}px`,
                  height: `${file2.pageDimensions[currentPair.pageIndex2].height}px`
                }}
              />

              {/* Diff highlights Overlay Layer */}
              <div className="absolute inset-0 pointer-events-none">
                {getFilteredHighlights(currentPair.highlights2).map((hl, idx) => (
                  <div
                    key={idx}
                    className="absolute rounded-sm transition-all duration-300 pointer-events-auto cursor-help group"
                    style={{
                      left: `${hl.x}px`,
                      top: `${hl.y}px`,
                      width: `${hl.w}px`,
                      height: `${hl.h}px`,
                      background:
                        hl.type === 'added'
                          ? 'rgba(16, 185, 129, 0.18)'
                          : hl.type === 'modified'
                          ? 'rgba(245, 158, 11, 0.18)'
                          : 'rgba(168, 85, 247, 0.18)',
                      border:
                        hl.type === 'added'
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : hl.type === 'modified'
                          ? '1px solid rgba(245, 158, 11, 0.4)'
                          : '1px dashed rgba(168, 85, 247, 0.6)',
                      boxShadow:
                        hl.type === 'added'
                          ? '0 0 4px rgba(16, 185, 129, 0.15)'
                          : hl.type === 'modified'
                          ? '0 0 4px rgba(245, 158, 11, 0.15)'
                          : '0 0 4px rgba(168, 85, 247, 0.15)'
                    }}
                  >
                    {/* Tooltip widget */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-950 text-white text-[9px] font-bold py-1 px-2.5 rounded-lg border border-zinc-800 shadow-xl z-30 whitespace-nowrap leading-none pointer-events-none">
                      {hl.type === 'added'
                        ? t('comparePdfs.addedText')
                        : hl.type === 'modified'
                        ? t('comparePdfs.modifiedText')
                        : t('comparePdfs.paragraphMovedLeft')}
                      <span className="text-zinc-400 block mt-1">"{hl.text}"</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Deleted Page placeholder blank board (file 2 has no corresponding page) */
            <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 w-full min-h-[500px] border border-dashed border-zinc-800 rounded-xl bg-zinc-950/60 backdrop-blur-md">
              <AlertCircle className="w-10 h-10 text-red-500/70 mb-4 animate-bounce" />
              {t('comparePdfs.deletedPageTitle')}
              <p className="text-[10px] text-zinc-600 mt-1 max-w-xs">
                {t('comparePdfs.deletedPageDesc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
