import type { PyodideInterface, FontToOutlineOptions, FontOutlineResult } from '../engine/types';
import { withInputFile, readOutputFile } from '../engine/runner';

export async function fontToOutline(
  pyodide: PyodideInterface,
  file: File,
  options?: FontToOutlineOptions
): Promise<FontOutlineResult> {
  const { dpi = 300, preserveSelectableText = false, pageRange = '' } = options || {};

  return withInputFile(pyodide, file, 'font', async (inputPath) => {
    const uid = crypto.randomUUID();
    const outputPath = `/output_font_${uid}.pdf`;

    const rawJsonResult = await pyodide.runPythonAsync(`
import pymupdf
import json

def parse_page_range(range_str, total_pages):
    if not range_str or range_str.strip() == '':
        return list(range(total_pages))
    
    pages = set()
    for part in range_str.split(','):
        part = part.strip()
        if '-' in part:
            start, end = part.split('-', 1)
            start = max(1, int(start.strip()))
            end = min(total_pages, int(end.strip()))
            pages.update(range(start - 1, end))
        else:
            page_num = int(part.strip())
            if 1 <= page_num <= total_pages:
                pages.add(page_num - 1)
    
    return sorted(list(pages))

def convert_fonts_to_outlines(input_doc, dpi=300, preserve_text=False, page_indices=None):
    output_doc = pymupdf.open()
    total_fonts = 0
    pages_processed = 0
    
    if page_indices is None:
        page_indices = range(len(input_doc))
    
    for page_idx in page_indices:
        if page_idx >= len(input_doc):
            continue
            
        page = input_doc[page_idx]
        pages_processed += 1
        
        try:
            font_list = page.get_fonts()
            total_fonts += len(font_list)
        except Exception:
            pass
        
        page_rect = page.rect
        zoom = dpi / 72
        mat = pymupdf.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        
        new_page = output_doc.new_page(width=page_rect.width, height=page_rect.height)
        img_rect = new_page.rect
        new_page.insert_image(img_rect, pixmap=pix)
        
        if preserve_text:
            try:
                text_instances = page.get_text("dict")
                for block in text_instances.get("blocks", []):
                    if block.get("type") == 0:
                        for line in block.get("lines", []):
                            for span in line.get("spans", []):
                                text = span.get("text", "")
                                bbox = span.get("bbox", [])
                                font_size = span.get("size", 12)
                                
                                if text and len(bbox) == 4:
                                    rect = pymupdf.Rect(bbox)
                                    new_page.insert_textbox(
                                        rect,
                                        text,
                                        fontsize=font_size,
                                        color=(1, 1, 1),
                                        render_mode=3,
                                    )
            except Exception:
                pass
    
    return output_doc, total_fonts

input_doc = pymupdf.open(${JSON.stringify(inputPath)})
total_pages = len(input_doc)

try:
    page_indices = parse_page_range(${JSON.stringify(pageRange)}, total_pages)
except Exception:
    page_indices = None

output_doc, fonts_converted = convert_fonts_to_outlines(
    input_doc,
    dpi=${dpi},
    preserve_text=${preserveSelectableText ? 'True' : 'False'},
    page_indices=page_indices
)

output_doc.save(${JSON.stringify(outputPath)}, garbage=4, deflate=True)

input_doc.close()
output_doc.close()

json.dumps({
    "fontsConverted": fonts_converted,
    "pagesProcessed": len(page_indices) if page_indices else total_pages,
    "totalPages": total_pages
})
    `);

    const resultData = JSON.parse(rawJsonResult);

    try {
      const pdf = readOutputFile(pyodide, outputPath, 'application/pdf');
      return {
        pdf,
        fontsConverted: resultData.fontsConverted || 0,
        pagesProcessed: resultData.pagesProcessed || 0,
        totalPages: resultData.totalPages || 0,
      };
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
