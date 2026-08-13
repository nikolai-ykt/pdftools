import type { PyodideInterface, CompressOptions } from '../engine/types';
import { withInputFile, readOutputFile } from '../engine/runner';

export async function compress(
  pyodide: PyodideInterface,
  file: File,
  options?: CompressOptions
): Promise<Blob> {
  const { quality = 'medium', removeMetadata = false } = options || {};

  const qualitySettings: Record<string, { imageQuality: number; maxDpi: number }> = {
    low: { imageQuality: 40, maxDpi: 72 },
    medium: { imageQuality: 65, maxDpi: 120 },
    high: { imageQuality: 85, maxDpi: 200 },
    maximum: { imageQuality: 95, maxDpi: 300 },
  };
  const settings = qualitySettings[quality] || qualitySettings['medium'];

  return withInputFile(pyodide, file, 'compress', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_compress_${uid}.pdf`;

    try {
      await pyodide.runPythonAsync(`
import pymupdf

doc = pymupdf.open(${JSON.stringify(inputPath)})
image_quality = ${settings.imageQuality}
max_dpi = ${settings.maxDpi}
remove_metadata = ${removeMetadata ? 'True' : 'False'}

processed_xrefs = set()

for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images(full=True)
    
    for img_info in image_list:
        xref = img_info[0]
        if xref in processed_xrefs:
            continue
        processed_xrefs.add(xref)
        
        try:
            base_image = doc.extract_image(xref)
            if not base_image:
                continue
            
            image_bytes = base_image["image"]
            width = base_image.get("width", 0)
            height = base_image.get("height", 0)
            
            if width < 50 or height < 50:
                continue
            
            if len(image_bytes) < 10000:
                continue
            
            pix = pymupdf.Pixmap(image_bytes)
            
            obj_str = doc.xref_object(xref)
            if pix.alpha or base_image.get("smask", 0) > 0 or "/SMask" in obj_str or "/Mask" in obj_str:
                continue
            
            if pix.width > 100 and pix.height > 100:
                scale = 1.0
                if pix.width > max_dpi * 10 or pix.height > max_dpi * 10:
                    scale = max(max_dpi * 10 / pix.width, max_dpi * 10 / pix.height)
                    if scale < 1.0:
                        new_width = int(pix.width * scale)
                        new_height = int(pix.height * scale)
                        if new_width > 50 and new_height > 50:
                            pix2 = pymupdf.Pixmap(pix, new_width, new_height, None)
                            pix = pix2
                
                if pix.alpha:
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                
                new_image_bytes = pix.tobytes(output="jpeg", jpg_quality=image_quality)
                
                if len(new_image_bytes) < len(image_bytes) * 0.9:
                    page.replace_image(xref, stream=new_image_bytes)
        except Exception:
            pass

if remove_metadata:
    doc.set_metadata({})
    doc.del_xml_metadata()

doc.save(
    ${JSON.stringify(outputPath)},
    garbage=4,
    deflate=True,
)
doc.close()
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
