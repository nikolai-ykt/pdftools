import type { PyodideInterface } from '../engine/types';
import { withInputFile, readOutputFile } from '../engine/runner';

export async function pdfToDocx(
  pyodide: PyodideInterface,
  file: File
): Promise<Blob> {
  return withInputFile(pyodide, file, 'docx', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_docx_${uid}.docx`;

    try {
      await pyodide.runPythonAsync(`
from pdf2docx import Converter

cv = Converter(${JSON.stringify(inputPath)})
cv.convert(${JSON.stringify(outputPath)})
cv.close()
      `);

      return readOutputFile(
        pyodide,
        outputPath,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    } catch (err) {
      try {
        pyodide.FS.unlink(outputPath);
      } catch {
        // Ignore
      }
      throw err;
    }
  });
}
