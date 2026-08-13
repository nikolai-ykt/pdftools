'use client';

import React from 'react';
import { ProcessingProgress } from '../ProcessingProgress';
import { useComparePdfs } from './hooks/useComparePdfs';
import { CompareFileUploader } from './components/CompareFileUploader';
import { CompareHeaderPanel } from './components/CompareHeaderPanel';
import { CompareNavigation } from './components/CompareNavigation';
import { ComparePageViewer } from './components/ComparePageViewer';
import type { FilterPills } from './types';

export interface ComparePDFsToolProps {
  className?: string;
}

export function ComparePDFsTool({ className = '' }: ComparePDFsToolProps) {
  const {
    file1,
    setFile1,
    file2,
    setFile2,
    filterPills,
    setFilterPills,
    status,
    progress,
    progressMessage,
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
    getFilteredHighlights,
    setError
  } = useComparePdfs();

  const currentPair = pairedPages[currentPairIdx];
  const hasResults = pairedPages.length > 0;

  const handleToggleFilter = (key: keyof FilterPills) => {
    setFilterPills(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* File Upload zones & Start trigger */}
      <CompareFileUploader
        file1={file1}
        file2={file2}
        isProcessing={isProcessing}
        onFile1Selected={handleFile1Selected}
        onFile2Selected={handleFile2Selected}
        onRemoveFile1={() => setFile1(null)}
        onRemoveFile2={() => setFile2(null)}
        onCompare={handleCompare}
        onError={setError}
        hasResults={hasResults}
      />

      {/* Processing Progress */}
      {isProcessing && (
        <ProcessingProgress
          progress={progress}
          status={status}
          message={progressMessage}
          onCancel={handleCancel}
          showPercentage
        />
      )}

      {/* Results Workspace */}
      {hasResults && (
        <div className="space-y-4">
          {/* Header Panel (Summary & Filter pills) */}
          <CompareHeaderPanel
            pairedPages={pairedPages}
            filterPills={filterPills}
            onToggleFilter={handleToggleFilter}
            onReset={handleClearAll}
          />

          {/* Navigation Controls */}
          <CompareNavigation
            currentPairIdx={currentPairIdx}
            totalPairs={pairedPages.length}
            currentPair={currentPair}
            isFullscreen={isFullscreen}
            onPrevPair={() => setCurrentPairIdx(prev => Math.max(0, prev - 1))}
            onNextPair={() => setCurrentPairIdx(prev => Math.min(pairedPages.length - 1, prev + 1))}
            onToggleFullscreen={toggleFullscreen}
          />

          {/* Side-by-Side Page Viewer */}
          <ComparePageViewer
            file1={file1}
            file2={file2}
            currentPair={currentPair}
            isFullscreen={isFullscreen}
            getFilteredHighlights={getFilteredHighlights}
            scrollContainer1Ref={scrollContainer1Ref}
            scrollContainer2Ref={scrollContainer2Ref}
            comparisonContainerRef={comparisonContainerRef}
            onScroll1={handleScroll1}
            onScroll2={handleScroll2}
          />
        </div>
      )}
    </div>
  );
}

export default ComparePDFsTool;
