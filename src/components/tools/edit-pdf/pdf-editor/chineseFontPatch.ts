/**
 * PDFCraft Chinese Font Patch
 * Intercepts pdf-lib PDFDocument.prototype.save to embed NotoSansSC-Regular when Chinese characters are present in annotations.
 */
export function getChineseFontPatchScript(): string {
  return `
    function setupChineseFontPatch() {
      const ext = window.pdfjsAnnotationExtensionInstance;
      const pdfLib = window.pdfLib || ext?.pdfLib;
      if (!pdfLib) return;

      const originalSave = pdfLib.PDFDocument.prototype.save;
      pdfLib.PDFDocument.prototype.save = async function(saveOptions) {
        console.log('[PDFCraft Patch] Intercepting save to inspect for Chinese text...');
        
        let hasChinese = false;
        const annotationExtension = window.pdfjsAnnotationExtensionInstance;
        const store = typeof annotationExtension?.getAnnotationStore === 'function'
          ? annotationExtension.getAnnotationStore()
          : null;

        if (store && store.annotations) {
          store.annotations.forEach(ann => {
            if (ann.name === 'freeText' && /[\\u4e00-\\u9fa5]/.test(ann.text || '')) {
              hasChinese = true;
            }
          });
        }

        if (hasChinese) {
          try {
            console.log('[PDFCraft Patch] Chinese text found. Embedding NotoSansSC-Regular font...');
            const fontBytes = await fetch('/fonts/NotoSansSC-Regular.ttf').then(res => res.arrayBuffer());
            const customFont = await this.embedFont(fontBytes, { subset: true });
            
            const originalEmbedFont = this.embedFont;
            this.embedFont = async function(fontToEmbed, embedOpts) {
              if (fontToEmbed === pdfLib.StandardFonts.Helvetica || fontToEmbed === 'Helvetica') {
                console.log('[PDFCraft Patch] Redirected Helvetica embed to NotoSansSC font');
                return customFont;
              }
              return originalEmbedFont.call(this, fontToEmbed, embedOpts);
            };
          } catch (e) {
            console.error('[PDFCraft Patch] Failed to embed Chinese font subset', e);
          }
        }

        return originalSave.call(this, saveOptions);
      };
    }
  `;
}
