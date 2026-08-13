/**
 * PDFCraft Annotation Patch
 * Provides cloud polygon drawing fixes (double-click and Enter key event dispatching).
 */
export function getAnnotationPatchScript(): string {
  return `
    function setupCloudFix() {
      // Ensure double-click bypasses text layer blocking to complete drawing
      document.addEventListener('dblclick', function(e) {
        const ext = window.pdfjsAnnotationExtensionInstance;
        const activeTool = ext?.activeAnnotation?.name;
        if (activeTool === 'cloud') {
          const konvaContent = document.querySelector('.konvajs-content');
          if (konvaContent) {
            console.log('[PDFCraft Patch] Intercepted dblclick for cloud tool, dispatching to Konva stage.');
            const dblEvent = new MouseEvent('dblclick', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: e.clientX,
              clientY: e.clientY
            });
            konvaContent.dispatchEvent(dblEvent);
          }
        }
      }, true);

      // Add Enter key support to elegantly complete and close polygon drawing
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          const ext = window.pdfjsAnnotationExtensionInstance;
          const activeTool = ext?.activeAnnotation?.name;
          if (activeTool === 'cloud') {
            const konvaContent = document.querySelector('.konvajs-content');
            if (konvaContent) {
              console.log('[PDFCraft Patch] Intercepted Enter key for cloud tool, dispatching dblclick to end drawing.');
              const dblEvent = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              konvaContent.dispatchEvent(dblEvent);
            }
          }
        }
      });
    }
  `;
}
