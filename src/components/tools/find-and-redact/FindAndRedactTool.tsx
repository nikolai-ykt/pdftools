'use client';

import React from 'react';
import { FileUploader } from '../FileUploader';
import { ProcessingProgress } from '../ProcessingProgress';
import { DownloadButton } from '../DownloadButton';
import { Button } from '@/components/ui/Button';

import { useFindAndRedact } from './hooks/useFindAndRedact';
import { usePdfPreview } from './hooks/usePdfPreview';
import { FileInfo } from './components/FileInfo';
import { SearchForm } from './components/SearchForm';
import { PdfPreview } from './components/PdfPreview';
import { MatchList } from './components/MatchList';
import { RedactionOptions } from './components/RedactionOptions';
import { FindAndRedactToolProps } from './types';

export type { FindAndRedactToolProps };

/**
 * FindAndRedactTool Component
 * 
 * Provides functionality to search for text across all pages of a PDF
 * and redact matching content. Useful for removing sensitive information
 * like account numbers, names, etc. from multi-page documents.
 */
export function FindAndRedactTool({ className = '' }: FindAndRedactToolProps) {
    const {
        t,
        tTools,
        file,
        status,
        progress,
        progressMessage,
        result,
        error,
        setError,
        searchTermsInput,
        setSearchTermsInput,
        parsedTerms,
        searchOptions,
        setSearchOptions,
        redactionOptions,
        setRedactionOptions,
        matches,
        matchesByPage,
        matchStats,
        filteredMatches,
        selectedPage,
        setSelectedPage,
        showPreview,
        isSearching,
        hasSearched,
        isProcessing,
        handleFilesSelected,
        handleClearFile,
        handleSearch,
        toggleMatchSelection,
        toggleSelectAll,
        handleRedact,
        handleCancel,
    } = useFindAndRedact();

    const {
        canvasRef,
        totalPages,
        previewPage,
        setPreviewPage,
        previewScale,
        setPreviewScale,
    } = usePdfPreview({
        file,
        matchesByPage,
        enabled: showPreview,
    });

    return (
        <div className={`space-y-6 ${className}`.trim()}>
            {/* File Upload */}
            {!file && (
                <FileUploader
                    accept={['application/pdf', '.pdf']}
                    multiple={false}
                    maxFiles={1}
                    onFilesSelected={handleFilesSelected}
                    onError={setError}
                    disabled={isProcessing}
                    label={tTools('uploadLabel')}
                    description={tTools('uploadDescription')}
                />
            )}

            {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {file && (
                <>
                    {/* File Info */}
                    <FileInfo
                        file={file}
                        onClear={handleClearFile}
                        disabled={isProcessing || isSearching}
                    />

                    {/* Search Section */}
                    <SearchForm
                        searchTermsInput={searchTermsInput}
                        onSearchTermsChange={setSearchTermsInput}
                        parsedTerms={parsedTerms}
                        searchOptions={searchOptions}
                        onSearchOptionsChange={setSearchOptions}
                        onSearch={handleSearch}
                        disabled={isProcessing}
                        isSearching={isSearching}
                    />

                    {/* Preview and Results - Side by Side Layout */}
                    {showPreview && hasSearched && matches.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                            <div className="lg:col-span-3">
                                <PdfPreview
                                    canvasRef={canvasRef}
                                    previewPage={previewPage}
                                    totalPages={totalPages}
                                    previewScale={previewScale}
                                    pagesWithMatches={matchStats.pagesWithMatches}
                                    onPageChange={setPreviewPage}
                                    onScaleChange={setPreviewScale}
                                    onSelectPageFilter={setSelectedPage}
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <MatchList
                                    totalMatchesCount={matches.length}
                                    filteredMatches={filteredMatches}
                                    matchStats={matchStats}
                                    selectedPage={selectedPage}
                                    previewPage={previewPage}
                                    showPreview={true}
                                    disabled={isProcessing}
                                    onToggleMatchSelection={toggleMatchSelection}
                                    onToggleSelectAll={toggleSelectAll}
                                    onSelectPageFilter={setSelectedPage}
                                    onPreviewPageChange={setPreviewPage}
                                />
                            </div>
                        </div>
                    )}

                    {/* No Preview Mode - Results Only */}
                    {!showPreview && hasSearched && matches.length > 0 && (
                        <MatchList
                            totalMatchesCount={matches.length}
                            filteredMatches={filteredMatches}
                            matchStats={matchStats}
                            selectedPage={selectedPage}
                            showPreview={false}
                            disabled={isProcessing}
                            onToggleMatchSelection={toggleMatchSelection}
                            onToggleSelectAll={toggleSelectAll}
                            onSelectPageFilter={setSelectedPage}
                        />
                    )}

                    {/* Redaction Options */}
                    {hasSearched && matches.length > 0 && (
                        <RedactionOptions
                            redactionOptions={redactionOptions}
                            onRedactionOptionsChange={setRedactionOptions}
                            disabled={isProcessing}
                        />
                    )}

                    {/* Progress */}
                    {isProcessing && (
                        <ProcessingProgress
                            progress={progress}
                            status={status}
                            message={progressMessage}
                            onCancel={handleCancel}
                            showPercentage
                        />
                    )}

                    {/* Action Buttons */}
                    {hasSearched && matches.length > 0 && (
                        <div className="flex flex-wrap items-center gap-4">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleRedact}
                                disabled={matchStats.selectedCount === 0 || isProcessing}
                                loading={isProcessing}
                            >
                                {isProcessing
                                    ? t('status.processing')
                                    : tTools('redactButton', { count: matchStats.selectedCount })
                                }
                            </Button>
                            {result && (
                                <DownloadButton
                                    file={result}
                                    filename={file.name.replace('.pdf', '_redacted.pdf')}
                                    variant="secondary"
                                    size="lg"
                                    showFileSize
                                />
                            )}
                        </div>
                    )}

                    {/* Success Message */}
                    {status === 'complete' && result && (
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                            <p className="text-sm font-medium">{tTools('successMessage')}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default FindAndRedactTool;
