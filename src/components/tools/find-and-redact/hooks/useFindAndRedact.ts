import { useState, useCallback, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
    searchTextInPDF,
    applyFindAndRedact,
    TextMatch,
    parseSearchTerms,
} from '@/lib/pdf/processors/find-and-redact';
import {
    SearchOptionsState,
    RedactionOptionsState,
    MatchStats,
    OperationStatus,
} from '../types';
import { hexToRgb } from '../utils/hexToRgb';

export function useFindAndRedact() {
    const t = useTranslations('common');
    const tTools = useTranslations('tools.findAndRedact');

    // File and operation status state
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<OperationStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [result, setResult] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Search state
    const [searchTermsInput, setSearchTermsInput] = useState('');
    const [searchOptions, setSearchOptions] = useState<SearchOptionsState>({
        caseSensitive: false,
        wholeWord: false,
        useRegex: false,
    });
    const [matches, setMatches] = useState<TextMatch[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Redaction options state
    const [redactionOptions, setRedactionOptions] = useState<RedactionOptionsState>({
        color: '#000000',
        addBorder: false,
        replacementText: '',
    });

    // Page filter state
    const [selectedPage, setSelectedPage] = useState<number | 'all'>('all');

    // Preview visibility state
    const [showPreview, setShowPreview] = useState(false);

    // Cancellation controller
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastProgressUpdateRef = useRef<number>(0);

    // Memoized parsed terms
    const parsedTerms = useMemo(() => parseSearchTerms(searchTermsInput), [searchTermsInput]);

    // Throttled progress update to prevent React render-thrashing on dense PDFs
    const updateProgress = useCallback((prog: number, message?: string) => {
        const now = Date.now();
        if (prog === 0 || prog === 100 || now - lastProgressUpdateRef.current > 50) {
            lastProgressUpdateRef.current = now;
            setProgress(prog);
            setProgressMessage(message || '');
        }
    }, []);

    // Efficient O(1) index map of matches by page number
    const matchesByPage = useMemo(() => {
        const map = new Map<number, TextMatch[]>();
        for (const match of matches) {
            const pageMatches = map.get(match.page);
            if (pageMatches) {
                pageMatches.push(match);
            } else {
                map.set(match.page, [match]);
            }
        }
        return map;
    }, [matches]);

    // Memoized aggregated statistics (counts, pages with matches)
    const matchStats = useMemo<MatchStats>(() => {
        const pages = new Set<number>();
        const pageCounts = new Map<number, number>();
        let selected = 0;

        for (const match of matches) {
            pages.add(match.page);
            pageCounts.set(match.page, (pageCounts.get(match.page) ?? 0) + 1);
            if (match.selected) {
                selected++;
            }
        }

        return {
            selectedCount: selected,
            pagesWithMatches: [...pages].sort((a, b) => a - b),
            pageCounts,
        };
    }, [matches]);

    // Memoized filtered matches based on page tab filter
    const filteredMatches = useMemo(() => {
        if (selectedPage === 'all') {
            return matches;
        }
        return matchesByPage.get(selectedPage) ?? [];
    }, [matches, selectedPage, matchesByPage]);

    const handleFilesSelected = useCallback((files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setError(null);
            setResult(null);
            setMatches([]);
            setHasSearched(false);
            setShowPreview(false);
            setSelectedPage('all');
        }
    }, []);

    const handleClearFile = useCallback(() => {
        setFile(null);
        setResult(null);
        setError(null);
        setStatus('idle');
        setMatches([]);
        setHasSearched(false);
        setSearchTermsInput('');
        setShowPreview(false);
        setSelectedPage('all');
    }, []);

    const handleSearch = useCallback(async () => {
        if (!file || parsedTerms.length === 0) {
            setError(tTools('enterSearchTerm'));
            return;
        }

        setIsSearching(true);
        setError(null);
        setMatches([]);
        setProgress(0);

        try {
            const searchResult = await searchTextInPDF(
                file,
                {
                    searchTerms: parsedTerms,
                    caseSensitive: searchOptions.caseSensitive,
                    useRegex: searchOptions.useRegex,
                    wholeWord: searchOptions.wholeWord,
                },
                updateProgress
            );

            if (searchResult.success) {
                setMatches(searchResult.matches);
                setHasSearched(true);
                if (searchResult.matches.length === 0) {
                    setError(tTools('noMatchesFound'));
                } else {
                    setShowPreview(true);
                }
            } else {
                setError(searchResult.error || tTools('searchFailed'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : tTools('searchFailed'));
        } finally {
            setIsSearching(false);
            setProgress(0);
        }
    }, [file, parsedTerms, searchOptions, tTools, updateProgress]);

    const toggleMatchSelection = useCallback((matchId: string) => {
        setMatches(prev =>
            prev.map(match =>
                match.id === matchId ? { ...match, selected: !match.selected } : match
            )
        );
    }, []);

    const toggleSelectAll = useCallback((selected: boolean) => {
        setMatches(prev => prev.map(match => ({ ...match, selected })));
    }, []);

    const toggleSelectPage = useCallback((pageNum: number, selected: boolean) => {
        setMatches(prev =>
            prev.map(match =>
                match.page === pageNum ? { ...match, selected } : match
            )
        );
    }, []);

    const handleRedact = useCallback(async () => {
        if (!file) return;

        const selectedMatches = matches.filter(m => m.selected);
        if (selectedMatches.length === 0) {
            setError(tTools('selectMatchesToRedact'));
            return;
        }

        abortControllerRef.current = new AbortController();
        setStatus('processing');
        setProgress(0);
        setError(null);
        setResult(null);

        try {
            const redactionResult = await applyFindAndRedact(
                file,
                matches,
                {
                    color: hexToRgb(redactionOptions.color),
                    addBorder: redactionOptions.addBorder,
                    replacementText: redactionOptions.replacementText.trim() || undefined,
                    selectedMatchIds: selectedMatches.map(m => m.id),
                },
                (prog, message) => {
                    if (!abortControllerRef.current?.signal.aborted) {
                        updateProgress(prog, message);
                    }
                }
            );

            if (abortControllerRef.current?.signal.aborted) {
                setStatus('idle');
                return;
            }

            if (redactionResult.success && redactionResult.result) {
                setResult(redactionResult.result);
                setStatus('complete');
            } else {
                setError(redactionResult.error || tTools('redactFailed'));
                setStatus('error');
            }
        } catch (err) {
            if (!abortControllerRef.current?.signal.aborted) {
                setError(err instanceof Error ? err.message : tTools('redactFailed'));
                setStatus('error');
            }
        }
    }, [file, matches, redactionOptions, tTools, updateProgress]);

    const handleCancel = useCallback(() => {
        abortControllerRef.current?.abort();
        setStatus('idle');
        setProgress(0);
    }, []);

    return {
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
        setShowPreview,
        isSearching,
        hasSearched,
        isProcessing: status === 'processing',
        handleFilesSelected,
        handleClearFile,
        handleSearch,
        toggleMatchSelection,
        toggleSelectAll,
        toggleSelectPage,
        handleRedact,
        handleCancel,
    };
}
