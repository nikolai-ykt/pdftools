import { loadPyodideEngine, resetPyodideEngine } from './loader';
import type { PyMuPDFEngine, PyodideInterface } from './types';
import * as ops from '../operations';

export * from './types';
export { loadPyodideEngine, resetPyodideEngine };

/**
 * Creates the high-level PyMuPDF engine instance wrapping Pyodide and operations.
 */
export function createPyMuPDFEngine(pyodide: PyodideInterface): PyMuPDFEngine {
  return {
    pyodide,
    pdfToDocx: (file) => ops.pdfToDocx(pyodide, file),
    pdfToPdfa: (file, options) => ops.pdfToPdfa(pyodide, file, options),
    htmlToPdf: (html, options) => ops.htmlToPdf(pyodide, html, options),
    deskewPdf: (file, options) => ops.deskewPdf(pyodide, file, options),
    fontToOutline: (file, options) => ops.fontToOutline(pyodide, file, options),
    getOCGLayers: (file) => ops.getOCGLayers(pyodide, file),
    toggleOCGLayer: (file, options) => ops.toggleOCGLayer(pyodide, file, options),
    addOCGLayer: (file, options) => ops.addOCGLayer(pyodide, file, options),
    deleteOCGLayer: (file, options) => ops.deleteOCGLayer(pyodide, file, options),
    renameOCGLayer: (file, options) => ops.renameOCGLayer(pyodide, file, options),
    compress: (file, options) => ops.compress(pyodide, file, options),
    photonCompress: (file, options) => ops.photonCompress(pyodide, file, options),
    extractPages: (file, pages) => ops.extractPages(pyodide, file, pages),
    replaceExistingText: (file, matches, replacementText, fitMode) =>
      ops.replaceExistingText(pyodide, file, matches, replacementText, fitMode),
    splitPdf: (file, ranges) => ops.splitPdf(pyodide, file, ranges),
  };
}
