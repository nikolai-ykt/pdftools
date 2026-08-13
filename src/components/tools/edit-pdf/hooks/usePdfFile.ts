import { useState, useCallback, useEffect } from 'react';

export function usePdfFile() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clean up old object URL when pdfUrl changes or unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setError(null);
      setPdfUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return URL.createObjectURL(selectedFile);
      });
    }
  }, []);

  const handleUploadError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  const handleClear = useCallback(() => {
    setPdfUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return null;
    });
    setFile(null);
    setError(null);
  }, []);

  const showFileVersion = useCallback((nextFile: File) => {
    setFile(nextFile);
    setPdfUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return URL.createObjectURL(nextFile);
    });
  }, []);

  return {
    file,
    pdfUrl,
    error,
    setError,
    handleFilesSelected,
    handleUploadError,
    handleClear,
    showFileVersion,
  };
}
