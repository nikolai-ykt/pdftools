import type { PyodideInterface } from '../engine/types';
import { withInputFile, readOutputFile } from '../engine/runner';

export async function extractPages(
  pyodide: PyodideInterface,
  file: File,
  pages: number[]
): Promise<Blob> {
  const pageIndices = pages.map((p) => p - 1);

  return withInputFile(pyodide, file, 'extract', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_extract_${uid}.pdf`;

    try {
      await pyodide.runPythonAsync(`
import pymupdf

doc = pymupdf.open(${JSON.stringify(inputPath)})
new_doc = pymupdf.open()

for page_index in ${JSON.stringify(pageIndices)}:
    if 0 <= page_index < len(doc):
        new_doc.insert_pdf(doc, from_page=page_index, to_page=page_index)

new_doc.save(${JSON.stringify(outputPath)}, garbage=4, deflate=True)
doc.close()
new_doc.close()
      `);

      return readOutputFile(pyodide, outputPath, 'application/pdf');
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
