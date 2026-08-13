import type {
  PyodideInterface,
  TextMatchInput,
  TextFitMode,
  ReplaceTextResult,
} from '../engine/types';
import { withInputFile, readOutputFile } from '../engine/runner';
import { resolvePublicAssetPath } from '../engine/loader';

export async function replaceExistingText(
  pyodide: PyodideInterface,
  file: File,
  matches: TextMatchInput[],
  replacementText: string,
  fitMode: TextFitMode = 'preserve'
): Promise<ReplaceTextResult> {
  return withInputFile(pyodide, file, 'replace_text', async (inputPath) => {
    const uid = crypto.randomUUID();
    const fontPath = `/replace_text_font_${uid}.ttf`;
    const outputPath = `/output_replace_text_${uid}.pdf`;

    const serializedMatches = JSON.stringify(matches);
    const serializedReplacement = JSON.stringify(replacementText);
    const serializedFitMode = JSON.stringify(fitMode);
    const needsUnicodeFont = /[^\u0000-\u00ff]/.test(replacementText);

    if (needsUnicodeFont) {
      const fontResponse = await fetch(
        resolvePublicAssetPath('/fonts/NotoSansSC-Regular.ttf')
      );
      if (!fontResponse.ok) {
        throw new Error('Unable to load the Unicode replacement font.');
      }
      pyodide.FS.writeFile(
        fontPath,
        new Uint8Array(await fontResponse.arrayBuffer())
      );
    }

    try {
      const diagnosticsJson = await pyodide.runPythonAsync(`
import json
import os
import re
import pymupdf

doc = pymupdf.open(${JSON.stringify(inputPath)})
matches = json.loads(${JSON.stringify(serializedMatches)})
replacement_text = json.loads(${JSON.stringify(serializedReplacement)})
fit_mode = json.loads(${JSON.stringify(serializedFitMode)})
font_path = ${needsUnicodeFont ? JSON.stringify(fontPath) : 'None'}
used_fallback_font = False
overflow_detected = False
has_digital_signatures = bool(doc.get_sigflags())

def normalize_font_name(value):
    name = (value or "").split("+")[-1].lower()
    return re.sub(r"[^a-z0-9]", "", name)

def builtin_font_name(span_font, flags):
    normalized = normalize_font_name(span_font)
    bold = bool(int(flags or 0) & 16)
    italic = bool(int(flags or 0) & 2)
    if "times" in normalized or "serif" in normalized:
        return "tibi" if bold and italic else "tibo" if bold else "tiit" if italic else "tiro"
    if "courier" in normalized or "mono" in normalized:
        return "cobi" if bold and italic else "cobo" if bold else "coit" if italic else "cour"
    return "hebi" if bold and italic else "hebo" if bold else "heit" if italic else "helv"

extracted_fonts = {}
temporary_fonts = []

def resolve_embedded_font(page, span_font):
    target = normalize_font_name(span_font)
    if not target:
        return None

    for font_info in page.get_fonts(full=True):
        xref = int(font_info[0] or 0)
        base_font = normalize_font_name(font_info[3] if len(font_info) > 3 else "")
        resource_font = normalize_font_name(font_info[4] if len(font_info) > 4 else "")
        if xref <= 0 or not (
            target == base_font or target == resource_font or
            target in base_font or base_font in target
        ):
            continue

        if xref in extracted_fonts:
            return extracted_fonts[xref]

        try:
            _basename, extension, _font_type, content = doc.extract_font(xref)
            if not content:
                continue
            safe_extension = extension if extension in ("ttf", "otf", "cff", "cid") else "font"
            extracted_path = f"/tmp/pdfcraft_original_{xref}.{safe_extension}"
            with open(extracted_path, "wb") as extracted_file:
                extracted_file.write(content)
            temporary_fonts.append(extracted_path)
            extracted_fonts[xref] = {"path": extracted_path, "xref": xref}
            return extracted_fonts[xref]
        except Exception:
            continue
    return None

prepared = []
for match in matches:
    page_index = int(match["page"]) - 1
    if page_index < 0 or page_index >= len(doc):
        continue

    page = doc[page_index]
    page_height = page.rect.height
    padding = 0.75
    x0 = max(page.rect.x0, float(match["x"]) - padding)
    y0 = max(page.rect.y0, page_height - float(match["y"]) - float(match["height"]) - padding)
    x1 = min(page.rect.x1, float(match["x"]) + float(match["width"]) + padding)
    y1 = min(page.rect.y1, page_height - float(match["y"]) + padding)
    rect = pymupdf.Rect(x0, y0, x1, y1)
    if rect.is_empty or rect.is_infinite:
        continue

    font_size = max(1.0, min(float(match["height"]), 200.0))
    text_color = (0, 0, 0)
    span_font = ""
    span_flags = 0
    text_origin = (rect.x0, rect.y1)
    target_rect = rect
    best_score = -1

    text_dict = page.get_text("dict")
    for block in text_dict.get("blocks", []):
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                span_rect = pymupdf.Rect(span.get("bbox", rect))
                overlap = (span_rect & rect).get_area()
                if overlap <= 0:
                    continue
                text_bonus = span_rect.get_area() * 10 if span.get("text", "") == match.get("text", "") else 0
                score = overlap + text_bonus
                if score > best_score:
                    best_score = score
                    target_rect = span_rect
                    font_size = max(1.0, min(float(span.get("size", font_size)), 200.0))
                    span_font = span.get("font", "")
                    span_flags = int(span.get("flags", 0))
                    text_origin = tuple(span.get("origin", (span_rect.x0, span_rect.y1)))
                    color_value = int(span.get("color", 0))
                    text_color = (
                        ((color_value >> 16) & 255) / 255.0,
                        ((color_value >> 8) & 255) / 255.0,
                        (color_value & 255) / 255.0,
                    )

    embedded_font = resolve_embedded_font(page, span_font)
    redaction_rect = target_rect + (-0.15, -0.15, 0.15, 0.15)
    page.add_redact_annot(redaction_rect, fill=False)
    prepared.append({
        "page_index": page_index,
        "rect": target_rect,
        "font_size": font_size,
        "text_color": text_color,
        "origin": text_origin,
        "font_name": builtin_font_name(span_font, span_flags),
        "font_file": embedded_font["path"] if embedded_font else None,
        "font_xref": embedded_font["xref"] if embedded_font else None,
    })

for page_index in sorted(set(item["page_index"] for item in prepared)):
    page = doc[page_index]
    page.apply_redactions(images=0, graphics=0, text=0)

for item in prepared:
    if not replacement_text:
        continue

    page = doc[item["page_index"]]
    original_font_file = item["font_file"]
    font_name = f"pdfcraftorig{item['font_xref']}" if original_font_file else item["font_name"]
    font_file = original_font_file
    insertion_size = item["font_size"]
    lines = replacement_text.splitlines() or [""]

    try:
        measuring_font = pymupdf.Font(fontfile=font_file) if font_file else pymupdf.Font(item["font_name"])
        widest_line = max((measuring_font.text_length(line, fontsize=insertion_size) for line in lines), default=0)
    except Exception:
        measuring_font = pymupdf.Font("helv")
        widest_line = max((measuring_font.text_length(line, fontsize=insertion_size) for line in lines), default=0)

    required_height = max(insertion_size, len(lines) * insertion_size * 1.2)
    width_overflow = widest_line > item["rect"].width + 0.5
    height_overflow = required_height > item["rect"].height + insertion_size * 0.35
    item_overflows = width_overflow or height_overflow
    overflow_detected = overflow_detected or item_overflows

    if fit_mode == "shrink" and item_overflows:
        width_ratio = item["rect"].width / widest_line if widest_line > 0 else 1
        height_ratio = item["rect"].height / required_height if required_height > 0 else 1
        insertion_size = max(1.0, insertion_size * min(1.0, width_ratio, height_ratio))

    insertion_rect = pymupdf.Rect(item["rect"])
    if fit_mode == "expand":
        insertion_rect.x1 = min(page.rect.x1, max(insertion_rect.x1, insertion_rect.x0 + widest_line + 1))
        insertion_rect.y1 = min(page.rect.y1, max(insertion_rect.y1, insertion_rect.y0 + required_height + 1))

    try:
        if len(lines) > 1 or fit_mode == "expand":
            page.insert_textbox(
                insertion_rect,
                replacement_text,
                fontname=font_name,
                fontfile=font_file,
                fontsize=insertion_size,
                lineheight=1.2,
                color=item["text_color"],
                overlay=True,
            )
        else:
            page.insert_text(
                pymupdf.Point(*item["origin"]),
                replacement_text,
                fontname=font_name,
                fontfile=font_file,
                fontsize=insertion_size,
                color=item["text_color"],
                overlay=True,
            )
    except Exception:
        used_fallback_font = True
        fallback_file = font_path
        fallback_name = "pdfcraft-unicode" if fallback_file else item["font_name"]
        if len(lines) > 1 or fit_mode == "expand":
            page.insert_textbox(
                insertion_rect,
                replacement_text,
                fontname=fallback_name,
                fontfile=fallback_file,
                fontsize=insertion_size,
                lineheight=1.2,
                color=item["text_color"],
                overlay=True,
            )
        else:
            page.insert_text(
                pymupdf.Point(*item["origin"]),
                replacement_text,
                fontname=fallback_name,
                fontfile=fallback_file,
                fontsize=insertion_size,
                color=item["text_color"],
                overlay=True,
            )

doc.save(${JSON.stringify(outputPath)}, garbage=4, deflate=True)
doc.close()

for temporary_font in temporary_fonts:
    try:
        os.remove(temporary_font)
    except OSError:
        pass

json.dumps({
    "usedFallbackFont": used_fallback_font,
    "overflowDetected": overflow_detected,
    "hasDigitalSignatures": has_digital_signatures,
})
      `);

      const diagnostics = JSON.parse(diagnosticsJson);
      const blob = readOutputFile(pyodide, outputPath, 'application/pdf');

      return { blob, diagnostics };
    } finally {
      if (needsUnicodeFont) {
        try {
          pyodide.FS.unlink(fontPath);
        } catch {
          // Ignore
        }
      }
    }
  });
}
