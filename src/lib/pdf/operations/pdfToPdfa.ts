import type { PyodideInterface, PdfToPdfaOptions } from '../engine/types';
import { withInputFile, readOutputFile } from '../engine/runner';

export async function pdfToPdfa(
  pyodide: PyodideInterface,
  file: File,
  _options?: PdfToPdfaOptions
): Promise<{ pdf: Blob }> {
  return withInputFile(pyodide, file, 'pdfa', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_pdfa_${uid}.pdf`;

    try {
      await pyodide.runPythonAsync(`
import pymupdf

doc = pymupdf.open(${JSON.stringify(inputPath)})

save_options = {
    "garbage": 4,
    "deflate": True,
}

doc.save(${JSON.stringify(outputPath)}, **save_options)
doc.close()
      `);

      const pdf = readOutputFile(pyodide, outputPath, 'application/pdf');
      return { pdf };
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
