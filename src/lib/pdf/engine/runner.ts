import type { PyodideInterface } from './types';

/**
 * Execute an operation with an input file written to Pyodide's virtual filesystem.
 * Automatically cleans up the input file when finished.
 */
export async function withInputFile<T>(
  pyodide: PyodideInterface,
  file: File,
  prefix: string,
  callback: (inputPath: string) => Promise<T>
): Promise<T> {
  const uid = crypto.randomUUID();
  const inputPath = `/input_${prefix}_${uid}.pdf`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    pyodide.FS.writeFile(inputPath, data);

    return await callback(inputPath);
  } finally {
    try {
      pyodide.FS.unlink(inputPath);
    } catch {
      // Ignore virtual filesystem cleanup errors
    }
  }
}

/**
 * Read a file from Pyodide's virtual filesystem directly as binary data,
 * avoiding Base64 encoding/decoding overhead.
 */
export function readOutputFile(
  pyodide: PyodideInterface,
  outputPath: string,
  mimeType = 'application/pdf'
): Blob {
  try {
    const bytes = pyodide.FS.readFile(outputPath);
    return new Blob([bytes as unknown as BlobPart], { type: mimeType });
  } finally {
    try {
      pyodide.FS.unlink(outputPath);
    } catch {
      // Ignore cleanup error
    }
  }
}

/**
 * Helper to convert base64 to Blob when base64 is returned by legacy python scripts.
 */
export function base64ToBlob(base64: string, mimeType = 'application/pdf'): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Safely run a Python script in Pyodide.
 */
export async function runPython<T = any>(
  pyodide: PyodideInterface,
  code: string
): Promise<T> {
  return pyodide.runPythonAsync(code);
}
