import { getChineseFontPatchScript } from './chineseFontPatch';
import { getToolbarCustomizationScript, ToolbarLabels } from './toolbarCustomization';
import { getAnnotationSnappingScript } from './annotationSnapping';
import { getAnnotationHistoryScript, AnnotationHistoryLabels } from './annotationHistory';
import { getAnnotationPatchScript } from './annotationPatch';
import { getExistingTextEditorScript, ExistingTextEditorLabels } from './existingTextEditor';

export interface PatchScriptLabels {
  toolbar: ToolbarLabels;
  history: AnnotationHistoryLabels;
  editor: ExistingTextEditorLabels;
}

export function buildPatchScriptContent(labels: PatchScriptLabels): string {
  return `
    (function() {
      console.log('[PDFCraft Patch] Initializing annotation patches...');

      ${getChineseFontPatchScript()}
      ${getToolbarCustomizationScript(labels.toolbar)}
      ${getAnnotationSnappingScript()}
      ${getAnnotationHistoryScript(labels.history)}
      ${getAnnotationPatchScript()}
      ${getExistingTextEditorScript(labels.editor)}

      const waitForExtension = async (timeout = 10000) => {
        const started = Date.now();
        while (!window.pdfjsAnnotationExtensionInstance) {
          if (Date.now() - started > timeout) {
            throw new Error('PDF extension initialization timeout');
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      };

      waitForExtension()
        .then(() => {
          console.log('[PDFCraft Patch] pdfjsAnnotationExtensionInstance found! Setting up patches...');
          setupCloudFix();
          setupColorPickerAndStroke();
          setupUndoRedoAndAuthorPatch();
          setupSnapping();
          setupChineseFontPatch();
          setupExistingTextEditing();
        })
        .catch(err => {
          console.warn('[PDFCraft Patch] Extension initialization waiting timed out', err);
        });
    })();
  `;
}

export function patchIframeContent(
  iframe: HTMLIFrameElement,
  labels: PatchScriptLabels
): boolean {
  try {
    const doc = iframe.contentDocument;
    if (!doc) return false;

    // 1. Hide native PDF.js download/save buttons
    const downloadBtn = doc.getElementById('download');
    const secondaryDownloadBtn = doc.getElementById('secondaryDownload');
    if (downloadBtn) downloadBtn.style.display = 'none';
    if (secondaryDownloadBtn) secondaryDownloadBtn.style.display = 'none';

    // 2. Hide save button from CustomToolbar (pdfjs-annotation-extension)
    const customToolbar = doc.querySelector('.CustomToolbar');
    if (customToolbar) {
      const buttons = customToolbar.querySelectorAll('li, button');
      buttons.forEach((btn: Element) => {
        const text = btn.textContent?.trim();
        if (text === '\u4fdd\u5b58' || text === 'Save') {
          (btn as HTMLElement).style.display = 'none';
        }
      });
    }

    // 3. Inject master script if not already present
    if (!doc.getElementById('pdfcraft-patch-script')) {
      const patchScript = doc.createElement('script');
      patchScript.id = 'pdfcraft-patch-script';
      patchScript.textContent = buildPatchScriptContent(labels);
      doc.body.appendChild(patchScript);
    }
    return true;
  } catch (e) {
    console.warn('[PDFCraft Patch] Failed to patch iframe content', e);
    return false;
  }
}
