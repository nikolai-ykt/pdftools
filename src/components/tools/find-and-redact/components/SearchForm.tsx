import React from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchOptionsState } from '../types';

interface SearchFormProps {
    searchTermsInput: string;
    onSearchTermsChange: (value: string) => void;
    parsedTerms: string[];
    searchOptions: SearchOptionsState;
    onSearchOptionsChange: (options: SearchOptionsState) => void;
    onSearch: () => void;
    disabled: boolean;
    isSearching: boolean;
}

export function SearchForm({
    searchTermsInput,
    onSearchTermsChange,
    parsedTerms,
    searchOptions,
    onSearchOptionsChange,
    onSearch,
    disabled,
    isSearching,
}: SearchFormProps) {
    const t = useTranslations('common');
    const tTools = useTranslations('tools.findAndRedact');

    return (
        <Card variant="outlined" size="lg">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
                {tTools('searchTitle')}
            </h3>

            {/* Search Input - Multiple Terms */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        {tTools('searchTermLabel')}
                    </label>

                    {/* Main Input */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTermsInput}
                            onChange={(e) => onSearchTermsChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && parsedTerms.length > 0) {
                                    e.preventDefault();
                                    onSearch();
                                }
                            }}
                            placeholder={tTools('searchInputPlaceholder')}
                            className="w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={disabled || isSearching}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Help text */}
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {tTools('searchInputHelp')}
                    </p>

                    {/* Parsed Terms Tags */}
                    {parsedTerms.length > 0 && (
                        <div className="mt-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {tTools('termsCount', { count: parsedTerms.length })}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onSearchTermsChange('')}
                                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    disabled={disabled || isSearching}
                                >
                                    {t('buttons.clearAll')}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {parsedTerms.map((term, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        {term}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newTerms = parsedTerms.filter((_, i) => i !== index);
                                                onSearchTermsChange(newTerms.join(', '));
                                            }}
                                            className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                            disabled={disabled || isSearching}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Search Options */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2 border-t border-gray-200 dark:border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={searchOptions.caseSensitive}
                            onChange={(e) =>
                                onSearchOptionsChange({ ...searchOptions, caseSensitive: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            disabled={disabled || isSearching}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            {tTools('caseSensitive')}
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={searchOptions.wholeWord}
                            onChange={(e) =>
                                onSearchOptionsChange({ ...searchOptions, wholeWord: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            disabled={disabled || isSearching || searchOptions.useRegex}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            {tTools('wholeWord')}
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={searchOptions.useRegex}
                            onChange={(e) => {
                                const useRegex = e.target.checked;
                                onSearchOptionsChange({
                                    ...searchOptions,
                                    useRegex,
                                    wholeWord: useRegex ? false : searchOptions.wholeWord,
                                });
                            }}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            disabled={disabled || isSearching}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            {tTools('useRegex')}
                        </span>
                    </label>
                </div>

                {/* Search Button */}
                <div className="flex justify-end">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={onSearch}
                        disabled={parsedTerms.length === 0 || disabled || isSearching}
                        loading={isSearching}
                        className="px-8"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {isSearching ? tTools('searching') : tTools('searchButton')}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
