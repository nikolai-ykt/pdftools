import { TextMatch } from '@/lib/pdf/processors/find-and-redact';
import { ProcessingStatus } from '../ProcessingProgress';

export interface FindAndRedactToolProps {
    className?: string;
}

export interface SearchOptionsState {
    caseSensitive: boolean;
    wholeWord: boolean;
    useRegex: boolean;
}

export interface RedactionOptionsState {
    color: string;
    addBorder: boolean;
    replacementText: string;
}

export interface MatchStats {
    selectedCount: number;
    pagesWithMatches: number[];
    pageCounts: Map<number, number>;
}

export type OperationStatus = ProcessingStatus;
