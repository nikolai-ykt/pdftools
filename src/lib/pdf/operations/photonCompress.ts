import type { PyodideInterface, PhotonCompressOptions } from '../engine/types';
import { withInputFile, readOutputFile } from '../engine/runner';

export async function photonCompress(
  pyodide: PyodideInterface,
  file: File,
  options?: PhotonCompressOptions
): Promise<Blob> {
  const { dpi = 150, quality = 85 } = options || {};

  return withInputFile(pyodide, file, 'photon', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_photon_${uid}.pdf`;

    try {
      await pyodide.runPythonAsync(`
import pymupdf

doc = pymupdf.open(${JSON.stringify(inputPath)})
new_doc = pymupdf.open()

target_dpi = ${dpi}
jpeg_quality = ${quality}

for page in doc:
    rect = page.rect
    zoom = target_dpi / 72
    mat = pymupdf.Matrix(zoom, zoom)
    
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img_bytes = pix.tobytes(output="jpeg", jpg_quality=jpeg_quality)
    
    new_page = new_doc.new_page(width=rect.width, height=rect.height)
    new_page.insert_image(new_page.rect, stream=img_bytes)

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
