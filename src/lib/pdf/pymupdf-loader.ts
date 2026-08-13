import {
  loadPyodideEngine,
  resetPyodideEngine,
  createPyMuPDFEngine,
} from './engine';
import type { PyMuPDFEngine } from './engine/types';

let cachedEngineInstance: PyMuPDFEngine | null = null;
let engineLoadingPromise: Promise<PyMuPDFEngine> | null = null;

/**
 * Load PyMuPDF using Pyodide engine (Modular API facade)
 */
export async function loadPyMuPDF(): Promise<PyMuPDFEngine> {
  if (cachedEngineInstance) {
    return cachedEngineInstance;
  }

  if (engineLoadingPromise) {
    return engineLoadingPromise;
  }

  engineLoadingPromise = (async () => {
    try {
      const pyodide = await loadPyodideEngine();
      cachedEngineInstance = createPyMuPDFEngine(pyodide);
      return cachedEngineInstance;
    } catch (error) {
      engineLoadingPromise = null;
      cachedEngineInstance = null;
      throw error;
    }
  })();

  return engineLoadingPromise;
}

/**
 * Reset the PyMuPDF loader instance (for testing or memory release)
 */
export function resetPyMuPDF(): void {
  cachedEngineInstance = null;
  engineLoadingPromise = null;
  resetPyodideEngine();
}

export * from './engine/types';
