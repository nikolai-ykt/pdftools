import type { PyodideInterface, HtmlToPdfOptions } from '../engine/types';
import { readOutputFile } from '../engine/runner';

export async function htmlToPdf(
  pyodide: PyodideInterface,
  html: string,
  options?: HtmlToPdfOptions
): Promise<Blob> {
  const {
    pageSize = 'a4',
    margins = { top: 50, right: 50, bottom: 50, left: 50 },
    attachments = [],
  } = options || {};

  const pageSizes: Record<string, [number, number]> = {
    a4: [595, 842],
    letter: [612, 792],
    legal: [612, 1008],
  };
  const [width, height] = pageSizes[pageSize] || pageSizes['a4'];

  const uid = crypto.randomUUID();
  const htmlPath = `/html_${uid}.html`;
  const outputPath = `/output_html_${uid}.pdf`;

  // Write HTML to virtual filesystem with unique path
  const encoder = new TextEncoder();
  const htmlBytes = encoder.encode(html);
  pyodide.FS.writeFile(htmlPath, htmlBytes);

  // Write attachments to virtual filesystem with unique paths
  const attachmentPaths: string[] = [];
  const attachmentsInfoList = [];

  for (let i = 0; i < attachments.length; i++) {
    const att = attachments[i];
    const attPath = `/attachment_${uid}_${i}`;
    attachmentPaths.push(attPath);

    if (att.content) {
      const attData = new Uint8Array(att.content);
      pyodide.FS.writeFile(attPath, attData);
    }

    attachmentsInfoList.push({
      filename: att.filename,
      contentType: att.contentType,
      path: attPath,
      hasContent: !!att.content,
    });
  }

  const attachmentsJson = JSON.stringify(attachmentsInfoList);

  try {
    await pyodide.runPythonAsync(`
import pymupdf
import json

with open(${JSON.stringify(htmlPath)}, 'r', encoding='utf-8') as f:
    html_content = f.read()

margin_left = ${margins.left ?? 50}
margin_top = ${margins.top ?? 50}
margin_right = ${margins.right ?? 50}
margin_bottom = ${margins.bottom ?? 50}
page_width = ${width}
page_height = ${height}

doc = pymupdf.open()

try:
    rect = pymupdf.Rect(margin_left, margin_top, page_width - margin_right, page_height - margin_bottom)
    story = pymupdf.Story(html=html_content)
    
    more = True
    while more:
        page = doc.new_page(width=page_width, height=page_height)
        filled, more = story.place(rect)
        story.draw(page)
except Exception:
    doc.close()
    doc = pymupdf.open()
    
    import re
    text = re.sub('<[^<]+?>', '', html_content)
    text = text.replace('&nbsp;', ' ').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
    
    lines = text.split('\\n')
    
    page = doc.new_page(width=page_width, height=page_height)
    y = margin_top
    fontsize = 11
    line_height = fontsize * 1.5
    
    for line in lines:
        line = line.strip()
        if not line:
            y += line_height / 2
            continue
            
        if y + line_height > page_height - margin_bottom:
            page = doc.new_page(width=page_width, height=page_height)
            y = margin_top
        
        page.insert_text((margin_left, y), line, fontsize=fontsize, fontname="helv")
        y += line_height

attachments_info = json.loads(${JSON.stringify(attachmentsJson)})
for att_info in attachments_info:
    if att_info['hasContent']:
        try:
            with open(att_info['path'], 'rb') as att_file:
                att_data = att_file.read()
            doc.embfile_add(
                name=att_info['filename'],
                buffer=att_data,
                filename=att_info['filename'],
                desc=f"Attachment: {att_info['filename']}"
            )
        except Exception:
            pass

doc.save(${JSON.stringify(outputPath)}, garbage=4, deflate=True)
doc.close()
    `);

    return readOutputFile(pyodide, outputPath, 'application/pdf');
  } finally {
    try {
      pyodide.FS.unlink(htmlPath);
    } catch {
      // Ignore
    }
    for (const attPath of attachmentPaths) {
      try {
        pyodide.FS.unlink(attPath);
      } catch {
        // Ignore
      }
    }
  }
}
