import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { TextMatch } from '@/lib/pdf/processors/find-and-redact';
import { loadPdfjs } from '@/lib/pdf/loader';
import { drawMatchHighlights } from '../utils/drawMatchHighlights';

interface UsePdfPreviewOptions {
    file: File | null;
    matchesByPage: Map<number, TextMatch[]>;
    enabled: boolean;
}

export function usePdfPreview({ file, matchesByPage, enabled }: UsePdfPreviewOptions) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
    const renderTaskRef = useRef<RenderTask | null>(null);

    const [previewPage, setPreviewPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [previewScale, setPreviewScale] = useState(1.0);

    // O(1) lookup of matches for the currently displayed preview page
    const pageMatches = useMemo(() => {
        return matchesByPage.get(previewPage) ?? [];
    }, [matchesByPage, previewPage]);

    // 1. Decoupled PDF Document Loader
    const loadPdf = useCallback(async () => {
        if (!file) return;

        try {
            const pdfjs = await loadPdfjs();
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

            pdfDocRef.current = pdf;
            setTotalPages(pdf.numPages);
        } catch (err) {
            console.error('Failed to load PDF for preview:', err);
        }
    }, [file]);

    // 2. Decoupled Page Renderer with RenderTask Cancellation
    const renderPreviewPage = useCallback(async () => {
        if (!pdfDocRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Cancel previous pending render task if user switched pages or zoom scale quickly
        if (renderTaskRef.current) {
            try {
                renderTaskRef.current.cancel();
            } catch {
                // Ignore cancellation errors
            }
            renderTaskRef.current = null;
        }

        try {
            const page = await pdfDocRef.current.getPage(previewPage);
            const viewport = page.getViewport({ scale: previewScale });

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            context.clearRect(0, 0, canvas.width, canvas.height);

            const renderTask = page.render({
                canvasContext: context,
                viewport: viewport,
            });

            renderTaskRef.current = renderTask;

            await renderTask.promise;

            // Draw highlight boxes over matches on current page
            drawMatchHighlights(context, pageMatches, previewScale, viewport.height);
        } catch (err: unknown) {
            // RenderingCancelledException is expected when fast-switching pages
            if (err && typeof err === 'object' && 'name' in err && err.name === 'RenderingCancelledException') {
                return;
            }
            console.error('Failed to render preview page:', err);
        }
    }, [previewPage, previewScale, pageMatches]);

    // Load PDF when file changes and preview is active
    useEffect(() => {
        if (!file || !enabled) {
            pdfDocRef.current = null;
            setTotalPages(0);
            return;
        }

        loadPdf();
    }, [file, enabled, loadPdf]);

    // Re-render page whenever preview state, scale, page, or matches change
    useEffect(() => {
        if (!enabled || !pdfDocRef.current) return;

        renderPreviewPage();
    }, [enabled, previewPage, previewScale, pageMatches, renderPreviewPage]);

    return {
        canvasRef,
        totalPages,
        previewPage,
        setPreviewPage,
        previewScale,
        setPreviewScale,
        renderPreviewPage,
    };
}
