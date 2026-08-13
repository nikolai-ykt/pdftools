import type { PyodideInterface, PdfRange } from '../engine/types';
import { withInputFile, readOutputFile } from '../engine/runner';

export async function splitPdf(
  pyodide: PyodideInterface,
  file: File,
  ranges: PdfRange[]
): Promise<Blob[]> {
  return withInputFile(pyodide, file, 'split', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPaths: string[] = [];

    for (let i = 0; i < ranges.length; i++) {
      outputPaths.push(`/output_split_${uid}_${i}.pdf`);
    }

    const rangesJson = JSON.stringify(ranges);
    const outputPathsJson = JSON.stringify(outputPaths);

    try {
      await pyodide.runPythonAsync(`
import pymupdf
import json

doc = pymupdf.open(${JSON.stringify(inputPath)})
ranges = json.loads(${JSON.stringify(rangesJson)})
output_paths = json.loads(${JSON.stringify(outputPathsJson)})

for i, r in enumerate(ranges):
    start = int(r["start"]) - 1
    end = int(r["end"])
    
    new_doc = pymupdf.open()
    page_indices = list(range(max(0, start), min(len(doc), end)))
    
    for page_index in page_indices:
        new_doc.insert_pdf(doc, from_page=page_index, to_page=page_index)
        
    new_doc.save(output_paths[i], garbage=4, deflate=True)
    new_doc.close()

doc.close()
      `);

      const blobs: Blob[] = [];
      for (const outputPath of outputPaths) {
        blobs.push(readOutputFile(pyodide, outputPath, 'application/pdf'));
      }
      return blobs;
    } catch (err) {
      for (const outputPath of outputPaths) {
        try {
          pyodide.FS.unlink(outputPath);
        } catch {
          // Ignore
        }
      }
      throw err;
    }
  });
}
