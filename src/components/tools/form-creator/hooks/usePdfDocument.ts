import { useState, useRef, useCallback } from 'react';
import { loadPdfjsLib } from '../utils/pdfUtils';
import { addPageToPdfFile } from '../services/pdfService';
import { VisualField } from '../types';

export function usePdfDocument() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pdfDocRef = useRef<any>(null);

  const loadPdf = useCallback(async (pdfFile: File) => {
    try {
      setError(null);
      const pdfjsLib = await loadPdfjsLib();
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfDocRef.current = pdf;
      setFile(pdfFile);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      return pdf;
    } catch (err) {
      console.error('Failed to load PDF:', err);
      setError('Failed to load PDF file.');
      return null;
    }
  }, []);

  const addBlankPage = useCallback(
    async (
      position: 'before' | 'after' | 'end',
      fields: VisualField[],
      onFieldsUpdated: (fields: VisualField[]) => void
    ) => {
      if (!file || isAddingPage) return;

      setIsAddingPage(true);
      try {
        const { newFile, updatedFields, newPageNum } = await addPageToPdfFile(
          file,
          currentPage,
          position,
          fields
        );
        onFieldsUpdated(updatedFields);
        setFile(newFile);

        const pdfjsLib = await loadPdfjsLib();
        const newArrayBuffer = await newFile.arrayBuffer();
        const newPdf = await pdfjsLib.getDocument({ data: newArrayBuffer }).promise;
        pdfDocRef.current = newPdf;
        setTotalPages(newPdf.numPages);
        setCurrentPage(newPageNum);
      } catch (err) {
        console.error('Failed to add blank page:', err);
        setError('Failed to add blank page.');
      } finally {
        setIsAddingPage(false);
      }
    },
    [file, currentPage, isAddingPage]
  );

  const clearPdf = useCallback(() => {
    setFile(null);
    setTotalPages(0);
    setCurrentPage(1);
    setError(null);
    pdfDocRef.current = null;
  }, []);

  return {
    file,
    setFile,
    totalPages,
    setTotalPages,
    currentPage,
    setCurrentPage,
    isAddingPage,
    error,
    setError,
    pdfDocRef,
    loadPdf,
    addBlankPage,
    clearPdf,
  };
}
